import { getOrderById, updateOrder, getMerchantById, getPaytmTransactions, claimPaytmTransaction } from './db';

/**
 * Simulates a crawler check on Paytm Business Dashboard
 * @param {string} orderId - The Order ID to verify
 * @returns {Promise<{success: boolean, message: string, txnId?: string}>}
 */
export async function verifyOrderWithPaytm(orderId) {
  const order = await getOrderById(orderId);
  if (!order) {
    return { success: false, message: 'Order not found.' };
  }

  if (order.status === 'SUCCESS') {
    return { success: true, message: 'Order already completed.', txnId: order.paytmTxnId };
  }

  const merchant = await getMerchantById(order.merchantId);
  if (!merchant) {
    return { success: false, message: 'Merchant not found.' };
  }

  const { paytmMID, paytmMobile, paytmPassword } = merchant;

  if (!paytmMID || !paytmMobile || !paytmPassword) {
    return {
      success: false,
      message: 'Paytm merchant credentials are not fully configured.'
    };
  }

  // Create crawl execution log messages
  const logs = [];
  const addLog = (msg) => {
    const time = new Date().toLocaleTimeString();
    logs.push(`[${time}] ${msg}`);
    console.log(`[PaytmCrawler] ${msg}`);
  };

  addLog(`Initiating verification for Order ID: ${orderId} (Amount: ₹${order.amount})`);
  addLog(`Using Paytm Merchant ID: ${paytmMID}`);
  addLog(`Connecting to Paytm Business login portal (using Role Mobile: ${paytmMobile.replace(/.(?=.{4})/g, '*')})...`);
  
  // Simulate 1.5s delay for page load & authentication
  await new Promise(resolve => setTimeout(resolve, 1200));
  
  addLog(`Submitting credentials & initiating secure session...`);
  addLog(`Session authenticated. Navigating to 'Payments Received & Settlements' dashboard...`);

  await new Promise(resolve => setTimeout(resolve, 800));

  addLog(`Querying recent transaction history. Filtering for Credit transactions...`);

  // Now inspect the mock Paytm transactions (supports both JSON and MongoDB)
  const rawTxList = await getPaytmTransactions(paytmMID);

  // Filter transactions:
  // 1. Must belong to the merchant's Paytm MID
  // 2. Must match the exact order amount
  // 3. Must NOT be claimed by another order
  // 4. Must be created *after* or *just before* the order creation (within a 10-minute window) to prevent double claiming old orders.
  const orderTime = new Date(order.createdAt).getTime();
  const tenMinutesAgo = orderTime - 10 * 60 * 1000;

  const matchingTx = rawTxList.find(tx => {
    if (tx.paytmMID !== paytmMID) return false;
    if (Number(tx.amount) !== Number(order.amount)) return false;
    if (tx.isClaimed) return false;
    
    const txTime = new Date(tx.createdAt).getTime();
    return txTime >= tenMinutesAgo;
  });

  if (matchingTx) {
    addLog(`MATCH FOUND! Detected Credit of ₹${matchingTx.amount} with Paytm Txn ID: ${matchingTx.txnId}`);
    
    // Claim the transaction
    matchingTx.isClaimed = true;
    
    // Update order status
    order.status = 'SUCCESS';
    order.paytmTxnId = matchingTx.txnId;
    order.verifiedAt = new Date().toISOString();
    order.logs = logs;

    // Save state
    await updateOrder(order);
    
    // Update transaction in db
    await claimPaytmTransaction(matchingTx.txnId);

    addLog(`Order ${orderId} marked as PAID successfully.`);
    return {
      success: true,
      message: 'Payment verified successfully.',
      txnId: matchingTx.txnId,
      logs
    };
  } else {
    addLog(`Scanning completed. No unclaimed transaction of ₹${order.amount} was found on the Paytm Dashboard for this time frame.`);
    
    // Save failed attempt logs inside the order
    order.logs = logs;
    await updateOrder(order);

    return {
      success: false,
      message: 'No matching payment credit detected in Paytm settlements.',
      logs
    };
  }
}
