# youtubeMetaData

Promise based

- Installation: `npm i youtube-meta-data --save`
- Usage: `require("youtube-meta-data")("https://www.youtube.com/watch?v=WhWc3b3KhnY").then((info)=>{console.log(info);}, (err)=>{/*ERRORHANDLING*/})`
- Works also with Shorted youtube-urls like `https://youtu.be/WhWc3b3KhnY`


Example Output: 
```
{

  title: 'Spring - Blender Open Movie',

  description: 'Produced by Blender Animation Studio. Made in Blender 2.8.Get the production files, assets and exclusive making-of videos by joining Blender Cloud at https:/...',

  keywords: 'animation, blender, b3d, short film, spring, blender 2.8, mountains, cg, cycles, forest, clouds, dog, girl, gimp, krita, inkscape, open source, free software',

  shortlinkUrl: 'https://youtu.be/WhWc3b3KhnY',

  embedinfo: {

    title: 'Spring - Blender Open Movie',

    author_name: 'Blender Animation Studio',

    author_url: 'https://www.youtube.com/c/BlenderAnimationStudio',

    type: 'video',

    height: 113,

    width: 200,

    version: '1.0',

    provider_name: 'YouTube',

    provider_url: 'https://www.youtube.com/',

    thumbnail_height: 360,

    thumbnail_width: 480,

    thumbnail_url: 'https://i.ytimg.com/vi/WhWc3b3KhnY/hqdefault.jpg',

    html: '<iframe width="200" height="113" src="https://www.youtube.com/embed/WhWc3b3KhnY?feature=oembed" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>'
  
  },

  videourl: 'https://www.youtube.com/watch?v=WhWc3b3KhnY&feature=youtu.be'

}
```