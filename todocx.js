let fs = require("fs").promises;
let splitSections = require("./splitSections.js");
let HTMLtoDOCX = require("html-to-docx");
const docx = require("docx");
let {
    Document,
    Packer,
    Paragraph,
    TextRun,
    Table,
    TableRow,
    TableCell,
    BorderStyle,

    WidthType,
    HeightRule
} = docx;

let ftotxt = async function(fname) {
    let f = await fs.readFile(fname);
    return f.toString();
};

let subsToParagraph = function(subs){
    let arr = [];
    for(let i = 0; i < subs.length; i++){
        let sub = subs[i];
        if(i === 0){
            arr.push(new TextRun({
                text: sub.ts
            }));
        }else{
            arr.push(new TextRun({
                text: sub.ts,
                break:2
            }));
        }
        arr.push(new TextRun({
            text: sub.body,
            break:1
        }));
    }
    return new Paragraph({
        children: arr
    });
};

let SubSection = function(subs1,subs2){
    return {
        properties: {},
        children: [
            new Table({
                width: {
                    size: 100,
                    type: WidthType.PERCENTAGE
                },
                rows: [
                    new TableRow({
                        height: {value: 13000, rule: HeightRule.ATLEAST},
                        children: [
                            new TableCell({
                                width: {
                                    size: 50,
                                    type: WidthType.PERCENTAGE
                                },
                                children: [subsToParagraph(subs1)],
                            }),
                            new TableCell({
                                width: {
                                    size: 50,
                                    type: WidthType.PERCENTAGE
                                },
                                children: [subsToParagraph(subs2)],
                            }),
                        ],
                    }),
                ]
            })
        ]    
    };
};


let removeLeading0s = function(str){
    let i = 0;
    for(; i < str.length-1; i++){
        if(str[i] !== "0"){
            break;
        }
    }
    return str.slice(i);
};
let validateInt = function(str){
    //returns [result err]
    str = removeLeading0s(str);
    let n = parseInt(str);
    return [n,n+"" !== str];//true means error
};
let validateFloat = function(str){
    //trailing 0 is legal
    let [dig,frac] = str.split(".");
    let d,f,err1,err2;
    err2 = false;
    [d,err1] = validateInt(dig);
    if(frac)[f,err2] = validateInt(frac);
    return [parseFloat(str),err1||err2];
    /*//returns [result,err]
    let arr = str.split(".");
    arr[0] = removeLeading0s(arr[0]);
    str = arr.join(".");
    let n = parseFloat(str);
    return [n,n+"" !== str];//true means error*/
};
function strrepeat(str,n){
    let s = "";
    for(let i = 0; i < n; i++){
        s += str;
    }
    return s;
}
function truncateInt(num,n){
    return (strrepeat("0",n+1)+Math.floor(num)).slice(-n);
}
function truncateFloat(num,n1,n2){
    let str = truncateInt(Math.round(num*(10**n2)),n1+n2);
    if(n2 === 0)return str;
    let d = str.slice(0,n1);
    let f = str.slice(n2);
    return d+"."+f;
    /*let dig = Math.floor(num);
    let frac = num%1;
    return truncateInt(dig,n1) +"."+ (frac+strrepeat("0",n2+2)).slice(2,2+n2);*/
}
function toTimeStamp(num){
    let d = Math.floor(num/86400);
    let h = Math.floor((num%86400)/3600);
    let m = Math.floor((num%3600)/60);
    let s = num%60;
    if(d !== 0){
        return `${d}:${truncateInt(h,2)}:${truncateInt(m,2)}:${truncateFloat(s,2,2)}`;
    }else{
        return `${h}:${truncateInt(m,2)}:${truncateFloat(s,2,2)}`;
    }
}
function fromTimeStamp(str){
    //return [result,err]
    //validate it first
    let arr = str.split(":").reverse().slice(0,4);
    //now in seconds, minutes, hours, days
    //validate seconds
    let errflag = false;
    let t = 0;
    let multiplier = [1,60,3600,86400];
    let result = [];
    for(let i = 0; i < arr.length; i++){
        let validator = i === 0 ? validateFloat : validateInt;
        let [n,err] = validator(arr[i]);
        result.push();
        t += n*multiplier[i]
        errflag ||= err;
    }
    return [t,errflag]
}

let parseSbv = function(str){
    let reg = /(?:[0-9]+\:)+[0-9]+(?:\.[0-9]+)?\,(?:[0-9]+\:)+[0-9]+(?:\.[0-9]+)?/g;
    let subs = [];
    let prematch = false;
    let match;
    while((match = reg.exec(str)) !== null){
        if(prematch){
            let ts = prematch[0];
            let start = prematch.index+ts.length;
            let end = match.index;
            let body = str.slice(start,end).trim();
            subs.push({ts,body});
        }
        prematch = match;
        //console.log(match[0],match.index);
    }
    subs.push({
        ts:prematch[0],
        body:str.slice(prematch.index+prematch[0].length).trim()
    });
    subs.map(s=>{
        let [start,end] = s.ts.split(",").map(ts=>fromTimeStamp(ts)[0]);
        s.start = start;
        s.end = end;
        return s;
    });
    //parsing complete
    return subs;
};


let main = async function() {
    let sub1 = parseSbv(await ftotxt(process.argv[2]));
    let sub2 = parseSbv(await ftotxt(process.argv[3]));
    
    let sections = splitSections(sub1,sub2);
    //console.log(sections);
    //return;
    const doc = new Document({
        sections: sections.map(([s1,s2])=>{
            return SubSection(s1,s2)
        })
    });
    
    // Used to export the file into a .docx file
    Packer.toBuffer(doc).then((buffer) => {
        fs.writeFile("out.docx", buffer);
    });
};

main();




/*
let main = async function() {
    let f1 = (await ftotxt(process.argv[2])).slice(0, 1000);
    let f2 = (await ftotxt(process.argv[3])).slice(0, 1000);
    const doc = new Document({
        sections: [
            SubSection(),
            {
                properties: {},
                children: [
                    new Table({
                        width: {
                            size: 100,
                            type: WidthType.PERCENTAGE
                        },
                        rows: [
                            new TableRow({
                                children: [
                                    new TableCell({
                                        width: {
                                            size: 50,
                                            type: WidthType.PERCENTAGE
                                        },
                                        children: [],
                                    }),
                                    new TableCell({
                                        width: {
                                            size: 50,
                                            type: WidthType.PERCENTAGE
                                        },
                                        children: [],
                                    }),
                                ],
                            }),
                        ]
                    })
                ]    
            },
            {
                properties: {},
                children: [
                    new Table({
                        width: {
                            size: 100,
                            type: WidthType.PERCENTAGE
                        },
                        rows: [
                            new TableRow({
                                children: [
                                    new TableCell({
                                        children: [],
                                    }),
                                    new TableCell({
                                        children: [],
                                    }),
                                    new TableCell({
                                        children: [],
                                    }),
                                    new TableCell({
                                        children: [],
                                    }),
                                ],
                            }),
                            new TableRow({
                                children: [
                                    new TableCell({
                                        children: [],
                                    }),
                                    new TableCell({
                                        children: [new Paragraph("Hello")],
                                        borders: {
                                            top: {
                                                style: BorderStyle.DASH_DOT_STROKED,
                                                size: 3,
                                                color: "FF0000",
                                            },
                                            bottom: {
                                                style: BorderStyle.DOUBLE,
                                                size: 3,
                                                color: "0000FF",
                                            },
                                            left: {
                                                style: BorderStyle.DASH_DOT_STROKED,
                                                size: 3,
                                                color: "00FF00",
                                            },
                                            right: {
                                                style: BorderStyle.DASH_DOT_STROKED,
                                                size: 3,
                                                color: "#ff8000",
                                            },
                                        },
                                    }),
                                    new TableCell({
                                        children: [],
                                    }),
                                    new TableCell({
                                        children: [],
                                    }),
                                ],
                            }),
                            new TableRow({
                                children: [
                                    new TableCell({
                                        children: [],
                                    }),
                                    new TableCell({
                                        children: [],
                                    }),
                                    new TableCell({
                                        children: [],
                                    }),
                                    new TableCell({
                                        children: [],
                                    }),
                                ],
                            }),
                            new TableRow({
                                children: [
                                    new TableCell({
                                        children: [],
                                    }),
                                    new TableCell({
                                        children: [],
                                    }),
                                    new TableCell({
                                        children: [],
                                    }),
                                    new TableCell({
                                        children: [],
                                    }),
                                ],
                            }),
                        ],
                    }),
                ]
            },
            {
                properties: {},
                children: [
                    new Paragraph({
                        children: [
                            new TextRun("Hello World"),
                            new TextRun({
                                text: "Foo Bar",
                                bold: true,
                            }),
                            new TextRun({
                                text: "\tGithub is the best",
                                bold: true,
                            }),
                        ],
                    }),
                ],
            },
            {
                properties: {},
                children: [
                    new Paragraph({
                        children: [
                            new TextRun("Hello World"),
                            new TextRun({
                                text: "Foo Bar",
                                bold: true,
                            }),
                            new TextRun({
                                text: "\tGithub is the best",
                                bold: true,
                            }),
                        ],
                    }),
                ],
            }
        ],
    });

    // Used to export the file into a .docx file
    Packer.toBuffer(doc).then((buffer) => {
        fs.writeFile("out.docx", buffer);
    });
};

main();
*/

/*
let main = async function() {
    let f1 = await ftotxt(process.argv[2]);
    let f2 = await ftotxt(process.argv[3]);
    //console.log(f2);
    console.log(HTMLtoDOCX);
    let html = `
<!DOCTYPE html>
<html lang="en-US">
<head><title>docx</title>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
</head>
<body style="margin:0px">
<div style="overflow:hidden;">
<div style="float:left;width:50%;box-sizing:border-box;border:1px solid #000;">${f1.slice(0,1000).replace(/\n/g,"<br>")}</div>
<div style="float:left;width:50%;box-sizing:border-box;border:1px solid #000;border-left:none;">${f2.slice(0,1000).replace(/\n/g,"<br>")}</div>
</div>
</body>
    `;
    fs.writeFile("out.html",html);
    let b = await HTMLtoDOCX(html);
    console.log(b.toString());
    fs.writeFile("out.docx",await HTMLtoDOCX(html));
    //fs.writeFile("out.docx",html);
};*/