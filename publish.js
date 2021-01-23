const { exec } = require('child_process');

// todo: 使用最后一次提交的package.json中的version进行判断
exec(`git tag v${process.env.npm_package_version}`, (err, stdout, stderr) => {
    if(err) {
        return;
    }
    exec('git push && git push --tags');
});

