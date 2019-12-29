# Hexo Front-matter: Open Badge

## What is it?

A front-matter interpreter for [Hexo](https://hexo.io) static site generator to resolve data from an open badge for use
in a post.

## Why does it exist?

While creating my personal blog I wanted to display open badges I have earned.  I could not find any existing
functionality to interpret the badges and to display the data sourced from verifiable third party sources.  I created
this plugin to enable the retrieval of Open badge data from both V1 and V2 open badges.

## Installation

1. Run `npm i @nibynool\hexo-frontmatter-openbadge` in your Hexo directory

## Usage

1. In the frontmatter of your post add a `badge:` line (eg. `badge: https://www.scrum.org/badges/awards/455192`)
2. You will likely need a custom layout or to adjust your theme to handle the additional data

### Badge details

#### Post data that is overridden

* `post.date`
* `post.updated`
* `post.title`
* `post.photo`
* `post.description`
* `post.photos[]` (the badge image is added to the array of photos)

#### Available data

The available data points will vary depending on what is included in the badge.  See the
[Open Badge specifications](https://www.imsglobal.org/sites/default/files/Badges/OBv2p0Final/index.html) for complete
details and historic versions of the specification.