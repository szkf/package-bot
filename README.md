![](https://github.com/szkf/package-bot/blob/master/PackageBot.png)
# package-bot
A Discord Parcel Tracking Bot

## Usage
### Adding new packages to list
To add a new package to your tracking list, type `p!add <package number> <courier>`

If the package number is correct and the courier is supported the bot will ask you to add a note, else the bot will send an error message. Notes are displayed in the tracking list next to the package number and are a easy way to differentiate between parcels.

To add a note type `p!note <note>` <br />
Notes are limited to 40 characters max. and can include emojis.

### Checking a package status without adding it to the tracking list
To check the status of a package, type `p!track <package number> <courier>`

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

### Viewing the PackageBot statistics
`p!stats`

### Viewing the list of supported couriers
`p!couriers`

### Viewing the list of commands
`p!help` displays the list of commands and describes their funciton
