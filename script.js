// Believe me guys, I wanted to use dayjs (lighter) but the bloody .toDate() was broken!
const moment = require("moment"),
  fs = require("fs"),
  config = require("./config.json");

// Valid double extensions to allow for (otherwise will only be last word from the last dot)
const doubleExtensions = [
  ".tar.gz",
  ".tar.bz2",
  ".tar.xz",
  ".tar.zst",
  ".css.gz",
];

/**
 * Makes sure the config is up to scratch, replaces trailing slash on directory if present
 * @param {string} fileName name of file relative to the directory
 * @returns {string} Birthdate of file
 */
const checkConfig = () => {
  checkConfigKeys(["directories"], config);
  // replace trailing / if found in directory name defined in config
  config.directories = config.directories.map((directory) => {
    checkConfigKeys(["path", "retention"], directory);
    return {
      path:
        directory.path.substr(directory.path.length - 1) === "/"
          ? directory.path.substr(0, directory.path.length - 1)
          : directory.path,
      retention: parseInt(directory.retention, 10),
    };
  });
};

/**
 * Check certain key is present inside an object
 * @param {string[]} keys List of keys required
 * @param {object} obj Object to check for keys inside
 */
const checkConfigKeys = (keys, obj) => {
  keys.forEach((key) => {
    if (!obj[key]) {
      console.error(
        `Key ${key} is missing from config.json, please add it to proceed!`
      );
      process.exit(1);
    }
  });
};

/**
 * Get creation date of file
 * @param {string} fileName name of file relative to the directory
 * @returns {string} Birthdate of file
 */
const getFileBirthtime = (file) => {
  const { birthtime } = fs.statSync(file);

  return birthtime;
};

/**
 * Does a really pretty log
 * @param {string} msg Log message
 * @returns void
 */
const log = (msg) => {
  console.log(`[retention-file-remover] ${msg}`);
};

/**
 * Seperate file name into extenionless string and extension string
 * @param {any} fileName
 * @returns {{fileName: string, extension: string}} Object containing fileName and extension
 */
const getExtensionlessFilenameExtension = (fileName) => {
  if (config.noDoubleDotFileExtensions) {
    const extension = `.${fileName.split(".").pop()}`;
    return { extension, fileName: fileName.replace(extension, "") };
  }
  const fileNameSplit = fileName.split(".");
  // Multiple dots found in filename, check and see if any are matching of double extensions
  if (fileNameSplit.length > 1) {
    const compareStr = `.${fileNameSplit[fileNameSplit.length - 2]}.${
      fileNameSplit[fileNameSplit.length - 1]
    }`;
    const isDoubleExtension = doubleExtensions.includes(compareStr);
    if (isDoubleExtension)
      return {
        extension: compareStr,
        fileName: fileName.replace(compareStr, ""),
      };
    const extension = `.${fileNameSplit[fileNameSplit.length - 1]}`;
    return { extension, fileName: fileName.replace(extension, "") };
  }
};

/**
 * Deletes a file in a promise because who wants to use a callback (not me)
 * @param {string} path Path of file to delete
 * @returns {Promise} Returns true/error if successful/unsuccessful
 */
const deleteFile = (path) => {
  return new Promise((resolve, reject) => {
    fs.unlink(path, (err) => {
      if (err) return reject(err);
      return resolve(true);
    });
  });
};

/**
 * Processes the directory in question
 * @param {string} path Path of directory to run checks on
 * @param {string} retention How many files should be kept before the oldest is deleted?
 */
const processDirectory = async (path, retention) => {
  fs.readdir(path, async (err, files) => {
    if (err) {
      console.error(`Error opening ${path}`, err);
      process.exit(1);
    }
    const formattedFiles = files
      .map((filename) => {
        const fileDetails = getExtensionlessFilenameExtension(filename);
        const { fileName } = fileDetails;
        let dateFromFilename = null;
        if (config.fileDateFormat) {
          const dateFromFilenameDate = moment(
            fileName,
            config.fileDateFormat
          ).toDate();

          const timeOfFile = dateFromFilenameDate.getTime();
          dateFromFilename = timeOfFile || null;
        }

        const fullPath = `${path}/${filename}`;

        return {
          ...fileDetails,
          date: dateFromFilename || getFileBirthtime(fullPath),
          path: fullPath,
        };
      })
      .sort((a, b) => {
        return b.date - a.date;
      });

    if (formattedFiles.length > retention) {
      const filesToDeleteCount = formattedFiles.length - retention;
      log(`Found ${filesToDeleteCount} file(s) to delete`);
      const filesToDelete = formattedFiles.splice(
        formattedFiles.length - filesToDeleteCount,
        formattedFiles.length
      );
      const deletedFiles = await Promise.all(
        filesToDelete.map(async (fileToDelete) => {
          await deleteFile(fileToDelete.path).catch((err) => {
            console.error(
              log(`There was an error removing file ${fileToDelete.path}`),
              err
            );
            return false;
          });
          return true;
        })
      );

      const deletedFilesCount = deletedFiles.filter(
        (value) => value === true
      ).length;

      log(
        `A total of ${deletedFilesCount} files were deleted based on retention configuration of ${retention}`
      );
    } else {
      log(
        `There were no files that were found based on retention configuration of ${retention}`
      );
    }
    return true;
  });
};

checkConfig();

(async () => {
  await Promise.all(
    config.directories.map(async (directory) => {
      await processDirectory(directory.path, directory.retention);
    })
  );
})().catch((err) => {
  console.error(log("There was an uncaught error when running"), err);
});
