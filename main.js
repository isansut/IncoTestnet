require('dotenv').config();
const ethers = require('ethers');
const fs = require('fs');

// Baca wallets.json
const wallets = JSON.parse(fs.readFileSync('./wallets.json', 'utf-8'));

// baca rpc dan contract dari .env
const provider = new ethers.providers.JsonRpcProvider(process.env.RPC_URL);
const USDC_ADDRESS = process.env.USDC_CONTRACT;
const CUSDC_ADDRESS = process.env.CUSDC_CONTRACT;

// fungsi mint dan aprove
const erc20Abi = [
  "function mint(address to, uint256 amount) external",
  "function approve(address spender, uint256 amount) external returns (bool)"
];

// fungsi shiled dan unshiled
const cusdcAbi = [
  "function wrap(uint256 tokenID_) external",
  "function unwrap(uint256 tokenID_) external"
];

// Fungsi delay
function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function runForWallet(walletData) {
  const wallet = new ethers.Wallet(walletData.privateKey, provider);
  const usdcContract = new ethers.Contract(USDC_ADDRESS, erc20Abi, wallet);
  const cusdcContract = new ethers.Contract(CUSDC_ADDRESS, cusdcAbi, wallet);
  const to = walletData.address;
  const decimals = 18;

  try {
    const mintAmount = ethers.utils.parseUnits("1000000", decimals);
    const unwrapAmount = ethers.utils.parseUnits("500000", decimals);

    console.log(`Wallet ${to}: Minting 1.000.000 USDC...`);
    const mintTx = await usdcContract.mint(to, mintAmount);
    await mintTx.wait();
    console.log(`Wallet ${to}: Mint success! TxHash: ${mintTx.hash}`);

    console.log(`Wallet ${to}: Approving Shield contract...`);
    const approveTx = await usdcContract.approve(CUSDC_ADDRESS, mintAmount);
    await approveTx.wait();
    console.log(`Wallet ${to}: Approve success! TxHash: ${approveTx.hash}`);

    console.log(`Wallet ${to}: Shiled 1.000.000 USDC...`);
    const wrapTx = await cusdcContract.wrap(mintAmount);
    await wrapTx.wait();
    console.log(`Wallet ${to}: Shiled success! TxHash: ${wrapTx.hash}`);

    console.log(`Wallet ${to}: UnShiled 500.000 USDC...`);
    const unwrapTx = await cusdcContract.unwrap(unwrapAmount);
    await unwrapTx.wait();
    console.log(`Wallet ${to}: UnShiled success! TxHash: ${unwrapTx.hash}`);

  } catch (error) {
    console.error(`Wallet ${to}: Error -`, error);
  }
}

async function main() {
  while (true) {
    for (let i = 0; i < 5; i++) {
      console.log(`Loop ke-${i + 1} dari 5...`);
      for (const walletData of wallets) {
        await runForWallet(walletData);
        await delay(5000);
      }
    }
    console.log("Selesai 5 loop, tunggu 24 jam...");
    await delay(24 * 60 * 60 * 1000);
  }
}

main();
