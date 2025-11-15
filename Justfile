build:
    mkdir resources
    
    cargo build --release
    mv target/release/proviler extension/resources

    [ -f "extension/resources/chart.js" ] || curl https://cdn.jsdelivr.net/npm/chart.js -o extension/resources/chart.js
    cd extension && npm run compile
