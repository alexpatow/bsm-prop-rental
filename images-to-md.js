// Convert Images to Md Files
// Goal of this script is to convert all of the images stored in the ./assets folder to posts in the ./_posts folder


// Require statements
const fs = require('fs');
const glob = require('glob');
const rimraf = require('rimraf');
const imageExtensions = ['JPG','jpg','jpeg','PNG','png','tiff'];

// Initialize the object which will store the information required for creating the .md files
var mdDocuments = [];


// Read images and create a JS object with their information
// Images should be in the following formats: .JPG, .jpg, .jpeg, .png, .PNG, .tiff
// They should be placed into folders in the following pattern: ./assets/:category/:page/file.(JPG|jpg|jpeg|PNG|png|tiff)
// For example: ./assets/Scenic/Desert Drop/Joseph desert 1.jpeg
glob('assets/*/*/*.+('+imageExtensions.join('|')+'|txt)', function(err, files) {
  if (err) {
    console.log(err);
  } else {
    // Object for storing which images are associated to which file
    var imagesObj = {};
    files.forEach(function(path, index, array){
      // Separate the path into an array so we can parse the second, third, and fourth elements
      const pathArray = path.split('/');
      const category = pathArray[1];
      const page = pathArray[2];
      const fileNameAndExtension = pathArray[3];

      if (!imagesObj[category]) {
        imagesObj[category] = {};
      }
      if (!imagesObj[category][page]){
        imagesObj[category][page] = {};
        imagesObj[category][page].images = [];
        imagesObj[category][page].desc = '';
      }
      if (imageExtensions.includes(getFileExtension(fileNameAndExtension))) {
        imagesObj[category][page].images.push(path);
      } else if (getFileExtension(fileNameAndExtension) == 'txt') {
        imagesObj[category][page].desc = fs.readFileSync(path, 'utf8');
      }
    });
    const date = new Date();
    const timestamp = date.getFullYear() + '-' + (date.getMonth()+1) + '-' + date.getDate();
    for (var category in imagesObj) {
      for (var page in imagesObj[category]){
        mdDocuments.push({
          filePath: './_posts/' + timestamp + '-' + page + '.md',
          data: '---\n' + 'layout: prop\n' + 'title: ' + generatePostName(page) + '\n' + 'categories: ' + category + '\n' + 'images: ' + JSON.stringify(imagesObj[category][page].images||null) + '\n' + 'desc: ' + JSON.stringify(imagesObj[category][page].desc||null) + '\n' +  '---'
        });
      }
    }
    rimraf('./_posts', rimrafCallback);
  }
});

// Takes in the filename and extension and returns the extension
function getFileExtension(fileNameAndExtension) {
  var periodArray = fileNameAndExtension.split('.');
  return periodArray[periodArray.length - 1];
}

function rimrafCallback(err){
  if (err) {
    console.log(err);
  } else {
    fs.mkdir('./_posts', mkdirCallback);
  }
}

function mkdirCallback(err){
  if (err) {
    console.log(err);
  } else {
    mdDocuments.map(function(doc){
      fs.writeFile(doc.filePath, doc.data, function(err){
        if (err) {
          console.log(err);
        }
      });
    });
  }
  console.log('Finshed writing files');
}

function generatePostName(page) {
  return page.replace(/-/g, ' ').replace(/\w*/g, function(txt){return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();});
}


