import { pinterestService } from './lib/pinterest/service';

async function testVierual() {
    console.log("Testing Pinterest Service...");
    const pins = await pinterestService.getTrendingPins();
    console.log(`Fetched ${pins.length} pins.`);
    if (pins.length > 0) {
        console.log("Sample Pin:", pins[0]);
    } else {
        console.log("No pins found. Possible scraping issue.");
    }

    console.log("\nTesting specific search 'cats'...");
    const searchPins = await pinterestService.searchPins('cats');
    console.log(`Fetched ${searchPins.length} cat pins.`);
}

testVierual();
