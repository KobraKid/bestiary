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

## Host Your Own Bestiary

It's easy to set up your own Bestiary database. See the [Bestiary Wiki](https://github.com/KobraKid/bestiary/wiki) for more info.

## Attributions

Logo created with [LogoMakr](https://LogoMakr.com/app)

<a href="https://www.flaticon.com/packs/font-awesome" title="arrow icons">Arrow icons created by Dave Gandy - Flaticon</a>

## Support

[Support me here!](https://ko-fi.com/kobrakid1337)