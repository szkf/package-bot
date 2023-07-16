![](https://github.com/szkf/package-bot/blob/master/assets/PackageBotLogo.png)
# PackageBot
A Discord Parcel Tracking Bot

## Table of Contents
- [Feature Overview](#feature-overview)
  - [Tracking List](#tracking-list)
  - [Notes](#notes)
  - [Status Change Notifications](#status-change-notifications)
  - [Supported Couriers](#supported-couriers)
  - [Language Support](#language-support)
- [Usage](#usage)
  - [Adding Packages](#adding-new-packages-to-list)
  - [Checking Package Status](#checking-a-package-status-without-adding-it-to-the-tracking-list)
  - [Displaying The Tracking List](#displaying-the-tracking-list)
    - [Deleting Packages](#deleting-packages-from-list)
    - [Editing Notes](#editing-a-note)
    - [Viewing Status History](#viewing-the-full-status-history)
  - [Auto Status Checking](#turning-the-auto-status-checking-on)
- [Setup](#setup)

## Feature Overview
### Parcel Tracking
PackageBot allows you to check the status of a parcel directly from Discord.

<img src="https://github.com/szkf/package-bot/blob/master/assets/Tracking.png" width="500px"/>

### Tracking List
PackageBot is going to alert you when the status of a package added to the tracking list changes.

<img src="https://github.com/szkf/package-bot/blob/master/assets/List.png" width="350px" />

### Notes
Notes are an easy way to differentiate between parcels.<br />They are displayed in the tracking list next to the package number.

### Status Change Notifications

<img src="https://github.com/szkf/package-bot/blob/master/assets/Notification.png" width="500px" />

### Supported Couriers
The latest version (v3.3.2) supports DPD, GLS and UPS.<br />Support for more couriers coming soon!

### Language Support
As of version 3.3.2 PackageBot supports the following languages:
* English
* German (Only for UPS, support for DPD and GLS coming soon)
* Polish

Support for more coming soon.

### Auto Detect Courier
PackageBot can detect the courier by package number.

## Usage
### Adding new packages to list
To add a new package to your tracking list, type `p!add <package number> <courier (optional)>`

If the package number is correct and the courier is supported the bot will ask you to add a note, else the bot will send an error message. Notes are displayed in the tracking list next to the package number and are an easy way to differentiate between parcels.

To add a note type `p!note <note>` <br />
Notes are limited to 40 characters max. and can include emojis.

### Checking a package status without adding it to the tracking list
To check the status of a package, type `p!track <package number> <courier (optional)>`

If the provided data is correct the bot will display the current status of the parcel.
It is also possible to add packages to the list via the tracking feature.

### Displaying the tracking list
To see the tracking list, type `p!list`

The list is paginated - 5 packages per page, each has a letter assigned based on its position in the list from A to E. You can navigate between pages by pressing the :arrow_left: and :arrow_right: emojis.

#### Deleting packages from list
To delete individual packages select them by pressing the corresponding 🇦-🇪 emojis and then press :wastebasket:.
To delete all packages from the current page press :wastebasket:. The bot will then prompt you to confirm the action.

#### Editing a note
To edit a note select a package and press :pencil:.

#### Viewing the full status history
To view the full status history of a parcel select the packages and press :information_source:.

### Turning the auto status checking on
PackageBot can also alert you of package status changes. To turn this feature on type `p!init`.

***Note!*** This is not required for use of the tracking feature (`p!track`) but if not turned on the tracking list will not update.

### Changing the language
`p!lang` or `p!language`

Supported languages: English, Polish, German (only for UPS parcels). More coming soon!

### Viewing the list of supported couriers
`p!couriers`

### Release notes
`p!version` or `p!v`

### Viewing the list of commands
`p!help` displays the list of commands and describes their function

## Setup
#### Step 1
Clone this repo and compile the typescript code using `npx tsc`.
#### Step 2
Run `npm install` to install all required dependencies.
#### Step 3
Add a `.env` file to the cloned repositories root directory:
```
package-bot
├── assets
├── src
├── dist (this folder is the output directory for tsc - it will appear after compiling)
├── PackageBot.png
├── README.md
├── config.json
├── package-lock.json
├── package.json
├── tsconfig.json
└── + .env
```
The `.env` file should contain the following:
```
BOT_TOKEN=your_bot_token_copied_from_discord_dev_portal
DB_CONNECTION=url_to_a_mongodb_database
```
***Note!*** Never share the bot token with anyone. <br />
The database url can be any MongoDB hosting platform as well as a local database.
#### Step 4
Run the `PackageBot.js` file in the `/dist` directory using `node ./dist/PackageBot.js`. <br />
***Note!*** PackageBot requires **Node 16.6 or higher**!
