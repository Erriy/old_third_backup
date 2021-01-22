const { exec } = require('child_process');


exec(`git tag v${process.env.npm_package_version}`, (err, stdout, stderr) => {
    if(err) {
        return;
    }
    exec('git push --tags');
});

