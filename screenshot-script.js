const puppeteer = require('puppeteer');
const fs = require('fs');

(async () => {
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();
  
  // Set viewport to a nice laptop size
  await page.setViewport({ width: 1440, height: 900 });

  const url = 'https://atomquest-goals-beta.vercel.app';
  console.log('Navigating to', url);
  
  try {
    // 1. Employee Dashboard
    await page.goto(url, { waitUntil: 'networkidle0' });
    
    // Get IDs dynamically
    const options = await page.$$eval('select.auth-select option', opts => opts.map(o => ({ value: o.value, text: o.textContent })));
    const employeeId = options.find(o => o.text.includes('EMPLOYEE')).value;
    const managerId = options.find(o => o.text.includes('MANAGER')).value;
    const adminId = options.find(o => o.text.includes('ADMIN')).value;
    
    // 1. Employee Dashboard
    await page.select('select.auth-select', employeeId);
    await new Promise(r => setTimeout(r, 2000));
    
    await page.click('a[href="/goals"]');
    await new Promise(r => setTimeout(r, 3000));
    await page.screenshot({ path: '/Users/smaryanarang/Desktop/1_employee_dashboard.png' });
    console.log('Saved 1_employee_dashboard.png');

    // 2. Manager Approvals
    await page.select('select.auth-select', managerId);
    await new Promise(r => setTimeout(r, 2000));
    
    await page.click('a[href="/approvals"]');
    await new Promise(r => setTimeout(r, 3000));
    await page.screenshot({ path: '/Users/smaryanarang/Desktop/2_manager_approvals.png' });
    console.log('Saved 2_manager_approvals.png');

    // 3. Employee Check-ins
    await page.select('select.auth-select', employeeId);
    await new Promise(r => setTimeout(r, 2000));
    
    await page.click('a[href="/check-ins"]');
    await new Promise(r => setTimeout(r, 3000));
    await page.screenshot({ path: '/Users/smaryanarang/Desktop/3_employee_checkins.png' });
    console.log('Saved 3_employee_checkins.png');

    // 4. Admin Analytics
    await page.select('select.auth-select', adminId);
    await new Promise(r => setTimeout(r, 2000));
    
    await page.click('a[href="/admin/analytics"]');
    await new Promise(r => setTimeout(r, 3000)); // Wait for Chart.js animation
    
    await page.screenshot({ path: '/Users/smaryanarang/Desktop/4_admin_analytics.png' });
    console.log('Saved 4_admin_analytics.png');
    
    // 5. Admin Reports
    await page.click('a[href="/admin/reports"]');
    await new Promise(r => setTimeout(r, 2000));
    
    await page.screenshot({ path: '/Users/smaryanarang/Desktop/5_admin_reports.png' });
    console.log('Saved 5_admin_reports.png');

  } catch (error) {
    console.error('Error generating screenshots:', error);
  } finally {
    await browser.close();
  }
})();
