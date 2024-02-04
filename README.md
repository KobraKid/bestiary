# Bestiary

A flexible video game bestiary and collection manager.

## Features

### Highly customizable bestiary entries

Entries can be stylized exactly as they would appear in-game, or customized to provide encyclopedic-level detail.

### Multiple game support

Jump between bestiary pages for multiple games, shown at the top of the screen.

### Collection management

Define collections like *Collected Gear* or *Defeated Enemies* and start checking items off your lists.

## General usage

Upon launching the application, you'll be connected to a default server. You can click on a game to start exploring the bestiary right away, or you can connect to a custom server to access different games' data.

The server you're connected to can be edited via File -> Options. You can host a server locally using MongoDB, or connect to a MongoDB Atlas instance.

Once you've connected to a server, the list of games in the server's database will appear along the top of the window. Clicking on a game will open its bestiary, with a list of groups appearing along the left edge of the window. The first group will be selected automatically, but you can click on any group to see its bestiary entries.

Bestiary entries can be clicked on to open their entry page. Depending on the group, you might see stats for an enemy monster, shops where an item can be purchased, or anything else specific to the game you opened.

### Collection management

Right clicking on a group in the list on the left edge brings up the *Manage* option. Here, you can add, edit, and remove collections for a particular group.

For example, suppose your game features recruitable NPCs. You can add a collection named "Recruited" and after accepting the popup, you'll see checkboxes appear beside each entry in the group. Hovering over the checkbox will expand a banner indicating which collection it is linked to. Checking the box will collect that entry, adding it to your totals displayed below the games list.

## Development

You may wish to set up your own bestiary database. To do so, you'll need a few things.

First of all, when running from source, you'll have access to two development-specific tools: importing and compiling. Importing is the first step, where a game packgae is imported into your database. Once a game package has been imported, you can compile it so that anyone can view it.

#### Packages

Packages contain the set of groups available within a particular game.

A package is a `package.json` file, which contains the following data:

```JavaScript
{
    "metadata": {
        "name": "<Game name>",
        "ns": "<Namespace/unique package prefix>",
        "icon": "<Relative path to the game's icon>",
        "langs": [ "<List of ISO-639 languages the game supports>" ],
        "groups": [
            {
                "ns": "<Group namespace/unique prefix>",
                "name": "<Group name>"
            }
        ]
    },
    "groups": [
        {
            "ns": "<Group namespace/unique prefix>",
            "entries": [
                {
                    "bid": "<Unique entry bestiary ID>",
                    ... // attributes for each entry
                }
            ]
        }
    ],
    "resources": [
        {
            "resId": "<Unique resource ID>",
            "values": {
                "<Supported language>": "<Resource value>",
                ...
            }
            // or
            "resId": "<Unique resource ID>",
            "type": "<Resource type (currently only image type is supported)>",
            "basePath": "<Path to image resource>"
        }
    ]
}
```

#### Groups

Group represent each "type" of collectible group within a game.

A group can be pretty much anything plural in a game, such as monsters, items, or abilities. Groups are shown on the left edge once a game package has been selected, and can be configured to host collections, as described in *Collection management*.

#### Entries

Entries represent individual items within a collectible group.

An entry contains all of the attributes particular to itself, as well as links to other entries. Links take the following form:

```JavaScript
{
    "type": "link",
    "group": "<Group namespace to link to>",
    "id": "<Entry bestiary ID to link to>"
}
```

### Importing

Once you've created a package, you can import it via File -> Dev Options -> Import...

Any errors encountered during the load are logged to the console.

### View setup

After a package is imported, you'll want to set up some views for your entries. Views consist of files in the following folder structure:

```
%BestiaryData%/<group namespace>/layout
                                       /preview
                                               /GroupName.hbs
                                       /view
                                            /GroupName.hbs
                                /scripts
                                        /GroupName.js
                                /style
                                      /partials
                                               /_partialFile.scss
                                      /preview
                                              /GroupName.scss
                                      /view
                                           /GroupName.scss
```

Files in the `preview` folders determine how entries are displayed in the group list (or when linked to with a Handlebars `{{view}}` element). Files in the `view` folders determine how a single entry is displayed when clicked. 

The `.hbs` files are Handlebars-parsed HTML files. The `.scss` and `.js` files also support Handlebars.

When running from source, these files will be parsed to build a layout for each entry. However, this can be slow as Handlebars needs to use the entry's attributes to populate the layout files. Once you've finished creating your layout files, they need to be compiled for general use.

### Compiling

Compiling is accessed via File -> Dev Options -> Complie.

Compiling runs the layout files through Handlebars for each entry in each group you've indicated you'd like to compile. By default, all groups are compiled, but only new entries are compiled. Compiling generates a layout document that is stored in the database, and contains the final HTML code for an entry's `preview` and `view` variants, in each of your game package's supported languages.

## Attributions

Logo created with [LogoMakr](https://LogoMakr.com/app)