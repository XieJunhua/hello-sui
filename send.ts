import { getFullnodeUrl, SuiClient } from '@mysten/sui/client';
import { Transaction } from '@mysten/sui/transactions';
import { Ed25519Keypair } from '@mysten/sui/keypairs/ed25519';
import { fromB64 } from '@mysten/sui.js/utils';
import { fromHex } from '@mysten/sui/utils';

// 从环境变量获取私钥
const SUI_PRIVATE_KEY = process.env.SUI_PRIVATE_KEY || '';

// 接收地址列表
const RECIPIENT_ADDRESSES = [
    // '0xf198f8b2b774600999bbfd8133ec651ce7633acfdd2df70666c0ae3d467ea62c', // 示例地址
    '0x00662fb04178e2350f772ca1e3dc503ba78fc7fcee10141db28335a44f2d34a5', // 示例地址
    '0xcfb544319f9640e0599d5940b1272c7f5e6ed09f71955e7963730c71638f8437'
    // 添加更多地址...
];

// Token相关配置
// const TOKEN_TYPE = '0xa1ec7fc00a6f40db9693ad1415d0c193ad3906494428cf252621037bd7117e29::usdc::USDC'; // USDC代币类型
const TOKEN_TYPE = '0xdba34672e30cb065b1f93e3ab55318768fd6fef66c15942c9f7cb846e2f900e7::usdc::USDC';

const AMOUNT_TO_SEND = 200000; // 发送数量(MIST) 0.2USDC

async function distributeTokens() {
    try {
        // 创建keypair
        const keypair = Ed25519Keypair.fromSecretKey(SUI_PRIVATE_KEY);

        // 连接到mainnet
        const client = new SuiClient({ url: getFullnodeUrl('mainnet') });
        // const client = new SuiClient({ url: getFullnodeUrl('devnet') });

        // 获取发送者地址
        const senderAddress = keypair.getPublicKey().toSuiAddress();

        console.log('发送者地址:', senderAddress);

        // 获取发送者的SUI代币
        const coins = await client.getCoins({
            owner: senderAddress,
            coinType: TOKEN_TYPE
        });

        if (coins.data.length === 0) {
            throw new Error('没有可用的SUI代币');
        }

        const tx = new Transaction();
        const primaryCoin = coins.data[0].coinObjectId;

        // 为每个接收地址创建转账操作
        for (const recipient of RECIPIENT_ADDRESSES) {
            // 分割代币并转账
            const [coin] = tx.splitCoins(tx.object(primaryCoin), [AMOUNT_TO_SEND]);
            tx.transferObjects([coin], recipient);
        }

        // 签名并执行交易
        const result = await client.signAndExecuteTransaction({
            transaction: tx,
            signer: keypair,
            requestType: 'WaitForLocalExecution',
            options: {
                showEffects: true,
            },
        });

        console.log('代币分发成功! 交易哈希:', result.digest);

        // 打印交易详情
        const txDetails = await client.getTransactionBlock({
            digest: result.digest,
            options: {
                showEffects: true,
                showInput: true,
                showEvents: true,
            },
        });

        console.log('交易详情:', JSON.stringify(txDetails, null, 2));

    } catch (e) {
        console.error('代币分发失败:', e);
        throw e;
    }
}

// 执行分发
distributeTokens().catch(console.error);
