const Ebay = artifacts.require("Ebay");
const { expectRevert } = require("@openzeppelin/test-helpers");


contract("Ebay", (accounts) => {
  let ebay;

  beforeEach(async () => {
    ebay = await Ebay.new();
    console.log(ebay.address);
  });

  const auction = {
    name: "car",
    description: "beautiful",
    min: 10,
  };

  const [seller, buyer1, buyer2] = [accounts[0], accounts[1], accounts[2]];

  it("should create auction", async () => {
    let auctions;
    await ebay.createAuction(
      auction.name,
      auction.description,
      auction.min
    );
    auctions = await ebay.getAuctions();

    assert(auctions.length === 1);
    assert(auctions[0].name === auction.name);
    assert(auctions[0].description === auction.description);
    assert(parseInt(auctions[0].min) === auction.min);
  });

  it("should not create an offer if auction doesnot exist", async()=>{
    await expectRevert(
        ebay.createOffer(1,{from:buyer1,value: auction.min+10}),
        "Auction doesn't exist"
    );
  });

  it("should not create an offer if bid is too low", async()=>{
    await ebay.createAuction(auction.name,
        auction.description,
        auction.min);
        await expectRevert(
            ebay.createOffer(1,{from: buyer1, value: auction.min - 1}),
            "price must be greater than min and best offer"
        );
  });

  it("should create an offer", async()=>{
    await ebay.createAuction(auction.name,
        auction.description,
        auction.min);
    await ebay.createOffer(1,{from: buyer1, value: auction.min});
    const userOffers = await ebay.getUserOffer(buyer1);

    assert(userOffers.length === 1);
    assert(parseInt(userOffers[0].id) ===1);
    assert(parseInt(userOffers[0].id) ===1);
    assert(userOffers[0].buyer === buyer1);
    assert(parseInt(userOffers[0].price) === auction.min);
  });

  it("should not transact if auction doesn't exist", async ()=>{
    await expectRevert(
        ebay.transaction(1),"Auction doesn't exist"
    );
  });

  it("should transact", async()=>{
    const bestPrice = web3.utils.toBN(auction.min + 10);
    await ebay.createAuction(auction.name,auction.description,auction.min);
    await ebay.createOffer(1,{from: buyer1, value:auction.min});
    await ebay.createOffer(1, {from: buyer2, value: bestPrice});
    const balanceBefore = web3.utils.toBN(await web3.eth.getBalance(seller));
    await ebay.transaction(1, {from: accounts[3]});
    const balanceAfter = web3.utils.toBN(await web3.eth.getBalance(seller));

    assert(balanceAfter.sub(balanceBefore).eq(bestPrice));

  })
});
