dependencies=("@napi-rs/canvas" "discord.js" "enhanced-ms" "jszip" "sequelize" "sokoban-engine" "sqlite3" "class-transformer")

if [ -d "node_modules" ]; then
    echo -e "deleting node modules\n"
    rm -rf "node_modules"
fi
if [ -d "package.json" ]; then
    echo -e "deleting package file\n"
    rm "package.json"
fi
if [ -d "package-lock.json" ]; then
    echo -e "deleting package lock file\n"
    rm "package-lock.json"
fi

echo -e "re creating package file\n"

npm init -y

echo -e "installing dependencies \n"

for str in ${dependencies[@]}; do
    echo -e "installing $str\n"
    npm install $str
done