// Simple test to verify pagination functionality
// This can be run in the browser console to test the API

async function testUserPagination() {
  const baseUrl = 'https://kushmag.uz/api/users/';
  
  console.log('Testing user pagination...');
  
  try {
    let allUsers = [];
    let nextUrl = baseUrl;
    let pageCount = 0;
    
    while (nextUrl && pageCount < 10) { // Safety limit
      pageCount++;
      console.log(`Fetching page ${pageCount}: ${nextUrl}`);
      
      const response = await fetch(nextUrl);
      const data = await response.json();
      
      console.log(`Page ${pageCount} - Count: ${data.count}, Results: ${data.results.length}`);
      
      allUsers.push(...data.results);
      nextUrl = data.next;
      
      // If next URL is relative, make it absolute
      if (nextUrl && nextUrl.startsWith('/api/')) {
        nextUrl = `https://kushmag.uz${nextUrl}`;
      }
    }
    
    console.log(`Total users fetched: ${allUsers.length}`);
    console.log(`Total pages: ${pageCount}`);
    console.log('Sample users:', allUsers.slice(0, 3));
    
    return allUsers;
  } catch (error) {
    console.error('Error testing pagination:', error);
  }
}

// Run the test
// testUserPagination();
