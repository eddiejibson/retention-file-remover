# retention-file-remover

That's right gang, this is a really handy file deletion script based on a retention factor! **It also allows for removal via remote SFTP servers**! This means a certain amount of files are deleted if over the configured retention number. This script will delete the **oldest** files first. This is handy for backups (can't keep backups forever, time to automate!), logs etc for those who don't trust Linuxes log rotation!

There are two available ways for the script to detect the oldest files:

- By file creation date (Easiest) : The script will delete the oldest files based on their creation date in the file system.

- By file name date ([Configurable](#filedateformat-optional), to your date format): The script will delete the file from their date defined in the file name (e.g even if the file `19/08/2021@12:30:00.txt` was created in 2001, it's date assumed would be the 19th August 2021 at 12:30 - if configured correctly)

## Installation

Installing is easy! Just clone the GitHub repository:

```bash
git clone git@github.com:eddiejibson/retention-file-remover.git
```

Then enter inside:

```bash
cd retention-file-remover
```

Install dependencies (there's only one, I promise!):

```bash
npm i
```

After [configuration](#configuration-configjson) (see below first, please!), you can start it

```bash
node script.js
```

## Configuration (config.json)

To configure the script, please create a file in the script directory, `config.json`, in here you must define some values for the script to run off.

### directories (required)

**There is only one required value, it is an array - `directories`**. Here you must define a list of directories and their respective retention (how many files to be kept before the oldest is deleted).

Here's an example:

```javascript
{
	"directories": [
		{  "path": "/home/jibn/backups", "retention": 5 }, // This will keep 5 files inside /home/jibn/backups, when another is created, the oldest will be deleted, making room for the next.
		{  "path": "/home/jibn/backups-two", "retention": 15 } // This will keep 15 files inside /home/jibn/backups-two, when another is created, the oldest will be deleted, making room for the next.
	],
}
```

So, to recap, inside the `directories` key must contain:

`path` _string_: Full absolute path to directory to check

`retention` _int_: How many files to keep before the oldest is removed

`sftp` (optional) _{host: string, password?: string, username: string}_ : SFTP connection information for remote server. **When using this option, it is not easy to determine file creation date, so you must set the fileDateFormat and file names must be accomdating of such**

`fileDateFormat` (optional) _string_: The key `fileDateFormat` **is optional**. It's only to be set if you want the script to ignore the creation date of a file and instead assume the file's creation date from the file name. **This will over-ride the value inside the main config's fileDateFormat, directory specific**

Here's the type:

```javascript
directories: {path: string, retention: number}[]
```

### fileDateFormat (optional)

The key `fileDateFormat` **is optional**. It's only to be set if you want the script to ignore the creation date of a file and instead assume the file's creation date from the file name.

**Note: Do not include the file extension here! As we'll accept multiple file types, whatever extension!**

So, in this example, if I had a file called `19/08/2021@12:30:00.txt`, the date assumed would be 19th August 2021, even if the file creation date was different.

**If you want to just use the files creation date, do not set this value!**

```javascript
{
	"fileDateFormat": "DD/MM/YYYY@HH:mm:ss" // This is the date format - WITHOUT the extension!
}
```

Here's the type:

```javascript
fileDateFormat?: string
```

### noDoubleDotFileExtensions (optional)

**Note: not really much point in using this**

So this is just a silly configuration option I added, this is for if you're a huge fan of efficiency and are 100% sure all your files inside all your directories do **not** include double dot file extensions (e.g `.tar.gz` or `.css.gz`) so the script doesn't run these checks to determine if the file extension is double dotted or not and just assumes from the last dot..

The default if not set is `false`, meaning checks are ran.

```javascript
{
	 "noDoubleDotFileExtensions": true, // Meaning no checks are ran
}
```

## Full configuration example

```javascript
{
	// Required. No default.
	"directories": [
		{  "path": "/home/jibn/backups", "retention": 5 }, // This will keep 5 files inside /home/jibn/backups, when another is created, the oldest will be deleted, making room for the next.
		{  "path": "/home/jibn/backups-two", "retention": 15 } // This will keep 15 files inside /home/jibn/backups-two, when another is created, the oldest will be deleted, making room for the next.
	],
	// Optional. Default: undefined
	"fileDateFormat": "DD/MM/YYYY@HH:mm:ss",
	// Optional. Default: false
	"noDoubleDotFileExtensions": false, // Meaning checks on double dot file extension are run (default anyway, no need to set!)
}
```
