const { exec } = require('child_process');


exec(`git tag v${process.env.npm_package_version} && git push && git push --tags`, (err, stdout, stderr) => {
    if(err) {
        console.log(err);
        return;
    }
    console.log(`stdout: ${stdout}`);
    console.log(`stderr: ${stderr}`);
});

