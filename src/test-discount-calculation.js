// Test discount calculation logic
// Based on your example:
// Total: 3,528,000 сум
// 10% discount = 352,800 сум
// Agreement amount = 75,200 сум
// Total discount = 352,800 + 75,200 = 428,000 сум
// New percentage = (428,000 / 3,528,000) * 100 = 12.13%
// Remaining = 3,528,000 - 428,000 = 3,100,000 сум

function testDiscountCalculation() {
  const totalSum = 3528000;
  const discountPercentage = 10;
  const agreementAmount = 75200;
  
  // Calculate base discount
  const baseDiscountAmount = (totalSum * discountPercentage) / 100;
  console.log('Base discount amount:', baseDiscountAmount); // Should be 352,800
  
  // Calculate total discount
  const totalDiscountAmount = baseDiscountAmount + agreementAmount;
  console.log('Total discount amount:', totalDiscountAmount); // Should be 428,000
  
  // Calculate new percentage
  const newPercentage = (totalDiscountAmount / totalSum) * 100;
  console.log('New percentage:', newPercentage.toFixed(2)); // Should be 12.13%
  
  // Calculate remaining amount
  const remainingAmount = totalSum - totalDiscountAmount;
  console.log('Remaining amount:', remainingAmount); // Should be 3,100,000
  
  return {
    totalSum,
    baseDiscountAmount,
    agreementAmount,
    totalDiscountAmount,
    newPercentage: parseFloat(newPercentage.toFixed(2)),
    remainingAmount
  };
}

// Test with your actual values from the screenshot
function testActualValues() {
  const totalSum = 6174000;
  const discountPercentage = 10;
  const agreementAmount = 6600;
  
  // Calculate base discount
  const baseDiscountAmount = (totalSum * discountPercentage) / 100;
  console.log('Base discount amount:', baseDiscountAmount); // Should be 617,400
  
  // Calculate total discount
  const totalDiscountAmount = baseDiscountAmount + agreementAmount;
  console.log('Total discount amount:', totalDiscountAmount); // Should be 624,000
  
  // Calculate new percentage
  const newPercentage = (totalDiscountAmount / totalSum) * 100;
  console.log('New percentage:', newPercentage.toFixed(2)); // Should be 10.11%
  
  // Calculate remaining amount
  const remainingAmount = totalSum - totalDiscountAmount;
  console.log('Remaining amount:', remainingAmount); // Should be 5,550,000
  
  return {
    totalSum,
    baseDiscountAmount,
    agreementAmount,
    totalDiscountAmount,
    newPercentage: parseFloat(newPercentage.toFixed(2)),
    remainingAmount
  };
}

console.log('=== Test with example values ===');
testDiscountCalculation();

console.log('\n=== Test with actual values ===');
testActualValues();
