const url = require('url');
const path = require('path');
const fs = require('fs');
const buildMainContent = require("./mainContent.js")
const buildBreadcrumb = require('./breadcrumb.js');
const getMimeType = require('./getMimeType.js');

const staticBasePath = path.join(__dirname,'..', 'static');
let stats;
let mainContent;
console.log("STATICPATH: "+staticBasePath)
const respond = (request, response) => {

  console.log(staticBasePath);

    let pathname = url.parse(request.url, true).pathname;
   
    pathname = decodeURIComponent(pathname);
    console.log("PATHNAME: "+pathname)
    if(pathname === '/favicon.ico')
       return false;
  

    const fullStaticPath = path.join(staticBasePath,pathname);

    if(!fs.existsSync(fullStaticPath)){
        response.write('404: File not found!')
        response.end();
        return false;
    }

    try{
        console.log("##############fullStaticPath: "+fullStaticPath)
        stats = fs.lstatSync(fullStaticPath);

    }catch(err){
        console.log(`lstatSync Error: ${err}`);
    }

    if(stats.isDirectory()){
     
       let data = fs.readFileSync(path.join(staticBasePath,
         '../project_files/index.html'), 'utf-8'); 

         let pathElements = pathname.split('/').reverse();
         pathElements.filter(element => element != '');
         const folderName = pathElements[0];

         // build main content
         mainContent = buildMainContent(fullStaticPath, pathname);

         data = data.replace('page_title', folderName);


         // build breadcrumb
         const breadcrumb = buildBreadcrumb(pathname);
         data = data.replace('pathname', breadcrumb);

         data = data.replace('mainContent', mainContent);

        

         response.statusCode = 200;
         response.write(data);
         return response.end();
    }

    if(!stats.isFile()){

        response.statusCode = 404;
        response.write('404: Access denied!');
        console.log('not a file!');
        return response.end();
    }
   
    let fileDetails = {};
    fileDetails.extname = path.extname(fullStaticPath);

    getMimeType(fileDetails.extname)
    .then(mime => {
        // response.statusCode = 200;
        // response.write(`status code in getMimeType function: ${mime}`);
        // return response.end();

        let head = {};
        let statusCode = 200;

        head['Content-Type'] = mime;

        // pdf file
        if(fileDetails.extname === '.pdf'){
            // online read
            head['Content-Disposition'] = 'inline';
            // download file
            // head['Content-Disposition'] = 'attachment;filename=file.pdf';
        }

        // audio or video file
        if(RegExp('audio').test(mime) || RegExp('video').test(mime)){
            head["Accept-Ranges"] = 'bytes';
        }


        // fs.promises.readFile(fullStaticPath, 'utf-8')
        // .then( data  =>{
           
        //         response.writeHead(statusCode, head);
        //         response.write(data);
        //         return response.end();
        //     }

        

        // ).catch(err => {

        //     response.statusCode = 404;
        //     response.write('404: File reading error!');
        //     return response.end();
        // });

        // stream chunks to your response object
        const fileStream = fs.createReadStream(fullStaticPath, options);
        response.writeHead(statusCode, head);
        fileStream.pipe(response);

        fileStream.on('close', ()=>{
            return response.end();
        });
        fileStream.on('error', error => {
            response.statusCode = 404;
            response.write('404: File stream error!');
            return response.end();
        });

    })
    .catch(err => {

        response.statusCode = 500;
        response.write('500: Internal server error!');
        return response.end();
    })
}

module.exports = respond;