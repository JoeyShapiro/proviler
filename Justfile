build:
    mkdir resources || true

    cargo build --release
    cp target/release/proviler extension/resources

    [ -f "extension/resources/chart.js" ] || curl https://cdn.jsdelivr.net/npm/chart.js -o extension/resources/chart.js
    cd extension && npm run compile

testfiles:
    gcc testfiles/main.c a.out
    gcc testfiles/main.c -ggdb -o mainc
    rustc testfiles/main.rs testfiles/mainrs
    cargo build
    # TODO maybe use cargo examples for each one
    # no. i need a set for all of them
    but i could use a subfolder to clean up i guess. then run all above them
    yeah like one for go as well
    and open parent folder. that seems fine. good enough at least
    examples isnt quite right. i mean,, it is, but its not all rust
    # TODO put name and full path on hover
