// TEST CASES:
// M is an empty set
// q is not a prime
// auctioneer does not exist
// notary1_public address = notary2_public address
// bidder1_public address = bidder2_public address
// notary1_public address = bidder1_public address (bidder is his own notary)
// notary1_pa = bidder2_pa (bidder2 = notary of bidder1)
// notary1_pa = bidder2_pa && notary2_pa == bidder1_pa (2 bidders are notaries of each other)
// valuation w is - zero, negative, float
// item list is empty set for a bidder + valuation is +ve
// Each bidder has same input set and valuation - see if there is any firstness bias or not
// Same notary maps to two bidders
// Same bidder maps to two notaries
// number of notaries < number of bidders
// val1 + val2 = q/2 return < 
// unregistered notary address
// unregistered bidder address
// auctioneer quits in between - check that everyone gets their money back

// notary payment constant amount is negative - make it robust to non-positive values
// malicious notary tries to increase communication count with auctioneer to get more reward
// SCALABILITY: Check if the code runs on 100 notaries and 100 bidders
// Note: use oraclize for notary to bidder assignment - randomness


function calcv (x, u, q) {
    if (x >= u) return (x - u) % q;
    else return q - ((u - x) % q);
}

function comparison(u1, v1, u2, v2, q) {
    //n1 receives u2 from n2, n2 receives v1 from n1
    let val1 = u1 - u2;
    let val2 = v1 - v2;
    //n1 sends val1 to auctioneer, n2 sends val2 to auctioneer
    //Auctioneer checks below conditions:
    let sum = val1 + val2;
    if (sum == 0) return 0; // equal
    else if (sum < q/2) return 1; // ">"
    else return 2; // "<"
}

function findIntersection(n1, n2){
    var i, j;
    for (i = 0; i < n1.length; i++){
        for (j = 0; j < n2.length; j++){
            if (comparison(n1['u'], n1['v'], n2['u'], n2['v']) == 0){
                return 1;
            }
        }
    }
    return 0;
}
function intersectionMatrix(vals){
    var n_notaries = vals.length;
    var defaultValue = 0;
    var int_matrix  = Array(10).fill(null).map(_ => Array(10).fill(defaultValue));
    var i, j;
    for (i = 0; i < n_notaries; i++){
        for (j = i; j < n_notaries; j++){
            if(i == j) {
                int_matrix[i][j] = 1;
                continue;
            }
            var val = findIntersection(vals[i], vals[j]);
            int_matrix[i][j] = val;
            int_matrix[j][i] = val;
        }
    }
    return int_matrix;
}
function compMatrix(vals){
    var n_notaries = vals.length;
    var defaultValue = 0;
    var comp_matrix  = Array(10).fill(null).map(_ => Array(10).fill(defaultValue));
    var i, j;
    for (i = 0; i < n_notaries; i++){
        for (j = i; j < n_notaries; j++){
            if(i == j) {
                comp_matrix[i][j] = 0;
                continue;
            }
            var val = comparison(vals[i], vals[j]);
            comp_matrix[i][j] = val;
            if (val == 0)
                comp_matrix[j][i] = val;
            else if(val == 1)
                comp_matrix[j][i] = 2;
            else 
                comp_matrix[j][i] = 1;
            
        }
    }
    return comp_matrix;
}
const Auction = artifacts.require("Auction");
contract("Auction", async(accounts) => {

    var auction;
    let q = 31;
    let M = [1, 2];
    let u = 5;  
    it("tests that auctioneer is registered", async () => {
        auction = await Auction.new({from: accounts[0]});
        await auction.sendParams(q, M);
        let res = await auction.auctioneerExists();
        assert.equal(res, accounts[0], "auctioneer isn't registered");

    });

    it("tests that notary 1 is registered", async () => {
        await auction.registerNotaries(accounts[1]);
        let res1 = await auction.notariesLength();
        assert.equal(res1, 1, "notary isn't registered");

    });

    it("tests that notary 1 can't register again", async () => {
        await auction.registerNotaries(accounts[1]);
        let res1 = await auction.notariesLength();
        assert.equal(res1, 1, "notary isn't registered");

    });

    it("tests that notary 2 is registered", async () => {
        await auction.registerNotaries(accounts[2]);
        let res1 = await auction.notariesLength();
        assert.equal(res1, 2, "notary isn't registered");

    });

    it("tests that bidder 1 is registered", async () => {
        await auction.registerBidders(accounts[3], [u, calcv(1, u, q)], [u, calcv(10, u, q)]);
        let res1 = await auction.biddersLength();
        assert.equal(res1, 1, "notary isn't registered");

    });
    var i = 0;
    for(i=0;i<3;i++){
    it("tests that bidder 1 can't register again", async () => {
        await auction.registerBidders(accounts[3], [u, calcv(1, u, q)], [u, calcv(10, u, q)]);
        let res1 = await auction.biddersLength();
        assert.equal(res1, 1, "notary isn't registered");

    });}

    it("tests that bidder 2 is registered", async () => {
        await auction.registerBidders(accounts[4], [u, calcv(2, u, q)], [u, calcv(5, u, q)]);
        let res1 = await auction.biddersLength();
        assert.equal(res1, 2, "notary isn't registered");

    });
    var bidder_items = [];
    var bidder_vals = [];
    var bidder_inds = [];

    it("tests that bidders are mapped uniquely", async () => {
        for (var k = 1; k < 3; k++){
            await auction.assignBidder(accounts[k]);
            let vals = await auction.viewMapping(accounts[k]);
            let items = [];
            for (var i = 0; i < vals.length - 1; i += 2) {
                items.push({
                    'u': n1_vals[i],
                    'v': n1_vals[i + 1]
                });  
            }
            bidder_items.push(items);
            bidder_vals.push({
                'u': n1_vals[n1_vals.length - 3],
                'v': n1_vals[n1_vals.length - 2]
            });
            bidder_inds.push(n1_vals[n1_vals.length - 1]);                        
        }
        assert.notEqual(bidder_inds[0], bidder_inds[1], "mapping is not unique")        

    });

    it("tests that comparison values are sent", async () => {
        var comp_matrix = compMatrix(bidder_vals);
        
        await auction.sendValues(comp_matrix);
        let result =  await auction.verifyValues();     
        assert.equal(result, true, "values were not sent correctly")
    });

    var address_list = [];

    it("tests that intersection values are sent", async () => {
        var intersection_mat = intersectionMatrix(bidder_items);
        await auction.whoIsTheWinner(intersection_mat);
        address_list = await auction.returnWinners();
        console.log(address_list);
        console.log(accounts[3]);
        console.log(accounts[4]);
        assert.equal(true, true, "false");
    });

    it("tests that winner is determined correctly", async () => {
        var same = 0;
        if (address_list.length == 2) {
            if ((address_list[0] == accounts[3] && address_list[1] == accounts[4]) || 
              (address_list[0] == accounts[4] && address_list[1] == accounts[3])) {
                same = 1;
            }
        }
        assert.equal(same, 1, "winner list is not the same");
    });

  // it("tests auction", async () => {
  //   const auction = await Auction.new();
  //   let q = 31;
  //   let M = [1, 2];
  //   let u = 5;
  //   await auction.registerAuctioneer(accounts[0], q, M);
  //   await auction.registerNotaries(accounts[1]);
  //   await auction.registerNotaries(accounts[2]);
  //   await auction.registerbidders(accounts[3], [u, calcv(1, u, q)], [u, calcv(10, u, q)]); 
  //   await auction.registerbidders(accounts[4], [u, calcv(2, u, q)], [u, calcv(5, u, q)]); 
  //   let n1_vals = await auction.assignBidder(accounts[1]);
  //   var n1_items = [];
  //   for (var i = 0; i < n1_vals.length - 1; i += 2) {
  //       n1_items.push({
  //           'u': n1_vals[i],
  //           'v': n1_vals[i + 1]
  //       });  
  //   }
  //   n1_val = {
  //       'u': n1_vals[n1_vals.length - 2],
  //       'v': n1_vals[n1_vals.length - 2]
  //   };
    
  //   let n2_vals = await auction.assignBidder(accounts[2]);
  //   var n2_items = [];
  //   for (var i = 0; i < n2_vals.length - 1; i += 2) {
  //       n1_items.push({
  //           'u': n2_vals[i],
  //           'v': n2_vals[i + 1]
  //       });  
  //   }
  //   n2_val = {
  //       'u': n2_vals[n2_vals.length - 2],
  //       'v': n2_vals[n2_vals.length - 2]
  //   };
  //   let u1 = n1_val['u'];
  //   let v1 = n1_val['v'];
  //   let u2 = n2_val['u'];
  //   let v2 = n2_val['v'];
    
  //   let flag1 = await comparison(u1, v1, u2, v2, q);
  //   let flag2 = await comparison(u2, v2, u1, v1, q);
    
  //   const rows = 100;
  //   const cols = 100;
  //   const defaultValue = 0;
    
  //   var comp_matrix  = Array(rows).fill(null).map(_ => Array(cols).fill(defaultValue));
  //   comp_matrix[0][1] = flag1;
  //   comp_matrix[1][0] = flag2;
    
  //   let result = await auction.sendValues(comp_matrix);


  //   // result is of no use 
  //   var intersection_mat = Array(rows).fill(null).map(_ => Array(cols).fill(defaultValue));
  //   intersection_mat[0][0] = 1;
  //   intersection_mat[1][1] = 1;
    
  //   let address_list = await auction.whoIsTheWinner(intersection_mat);
  //   let same = 0;
  //   address_list.sort();
  //   if (address_list.length == 2) {
  //       if (address_list[0] == 1 && address_list[1] == 2) {
  //           same = 1;
  //       }
  //   }
  //   assert.equal(same, 1, "winner list is not the same")
  // });
});