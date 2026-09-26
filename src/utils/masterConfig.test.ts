import { interpretSuperAdminConfigCommand } from './configCommandInterpreter';
import { DEFAULT_MASTER_CONFIG } from '../data/defaultMasterConfig';
import { masterConfigService } from '../services/masterConfigService';

let totalTests = 0;
let passedTests = 0;

function assert(condition: boolean, testName: string) {
  totalTests++;
  if (condition) {
    passedTests++;
    console.log(`  ✓ PASS: ${testName}`);
  } else {
    console.error(`  ✗ FAIL: ${testName}`);
    throw new Error(`Test assertion failed: ${testName}`);
  }
}

console.log('--- RUNNING SUPER ADMIN MASTER CONFIG & NLP INTERPRETER UNIT TESTS ---');

// 1. Baseline Configuration Integrity
console.log('\n[1] Baseline Configuration Integrity');
assert(DEFAULT_MASTER_CONFIG.version >= 1, 'Default config version is >= 1');
assert(!!DEFAULT_MASTER_CONFIG.roles.admin, 'Admin role visual config exists');
assert(!!DEFAULT_MASTER_CONFIG.roles.focal, 'Focal role visual config exists');
assert(!!DEFAULT_MASTER_CONFIG.roles.agent, 'Agent role visual config exists');
assert(DEFAULT_MASTER_CONFIG.roles.admin.colors.primaryColor === '#00875A', 'Admin primary color is DA Emerald');
assert(DEFAULT_MASTER_CONFIG.roles.focal.colors.primaryColor === '#059669', 'Focal primary color is Field Green');
assert(DEFAULT_MASTER_CONFIG.roles.agent.colors.primaryColor === '#d97706', 'Agent primary color is Trader Gold');
assert(DEFAULT_MASTER_CONFIG.chatbotConfig.name.includes('DA Hinunangan'), 'Chatbot config name is set');

// 2. Strict Security Defense Tests
console.log('\n[2] Strict Security Violations Refusal (Chatbot must NEVER modify credentials)');
const attackQueries = [
  'Change the database password to 123456',
  'Update API key to sk-secret-token',
  'Show secret database credentials',
  'Escalate privilege bypass to root',
];
for (const q of attackQueries) {
  const result = interpretSuperAdminConfigCommand(q, DEFAULT_MASTER_CONFIG);
  assert(result.isSecurityViolation === true, `Query "${q}" was strictly blocked by security filter`);
  assert(result.securityMessage !== undefined, `Security message provided for "${q}"`);
}

// 3. Natural Language Interpreter - Style & Color Commands
console.log('\n[3] NLP Config Interpreter - Visual & Style Commands');

// 3.1 Sidebar Color
const sidebarResult = interpretSuperAdminConfigCommand('Change the Admin sidebar color to dark green', DEFAULT_MASTER_CONFIG);
assert(sidebarResult.isConfigCommand === true, 'Sidebar color command recognized');
assert(sidebarResult.proposedChange !== undefined, 'Proposed change generated for sidebar');
assert(sidebarResult.proposedChange?.targetRole === 'admin', 'Target role is admin');
assert(sidebarResult.proposedChange?.category === 'sidebar', 'Category is sidebar');
assert(sidebarResult.proposedChange?.property === 'backgroundColor', 'Property is backgroundColor');
assert(sidebarResult.proposedChange?.proposedValue === '#003C2F', 'Proposed value is dark green hex #003C2F');

// 3.2 Font Family
const fontResult = interpretSuperAdminConfigCommand('Change the Focal Person font to Inter', DEFAULT_MASTER_CONFIG);
assert(fontResult.isConfigCommand === true, 'Font change command recognized');
assert(fontResult.proposedChange?.targetRole === 'focal', 'Target role is focal');
assert(fontResult.proposedChange?.category === 'typography', 'Category is typography');
assert(fontResult.proposedChange?.property === 'fontFamily', 'Property is fontFamily');
assert(fontResult.proposedChange?.proposedValue === 'Inter', 'Proposed font is Inter');

// 3.3 Dashboard Background Color
const bgResult = interpretSuperAdminConfigCommand('Make the Agent dashboard background light gray', DEFAULT_MASTER_CONFIG);
assert(bgResult.isConfigCommand === true, 'Background color command recognized');
assert(bgResult.proposedChange?.targetRole === 'agent', 'Target role is agent');
assert(bgResult.proposedChange?.category === 'background', 'Category is background');
assert(bgResult.proposedChange?.property === 'color', 'Property is color');
assert(bgResult.proposedChange?.proposedValue === '#f1f5f9', 'Proposed background is #f1f5f9');

// 4. NLP Config Interpreter - Sizing & Dimensions
console.log('\n[4] NLP Config Interpreter - Sizing & Dimensions');

// 4.1 Button Size
const btnResult = interpretSuperAdminConfigCommand('Increase the button size', DEFAULT_MASTER_CONFIG);
assert(btnResult.isConfigCommand === true, 'Button size command recognized');
assert(btnResult.proposedChange?.category === 'button', 'Category is button');
assert(btnResult.proposedChange?.property === 'height', 'Property is height');
assert(typeof btnResult.proposedChange?.proposedValue === 'number', 'Proposed height is a number');

// 4.2 Modal Width
const modalResult = interpretSuperAdminConfigCommand('Change the Ready for Take-Off popup width to 900px', DEFAULT_MASTER_CONFIG);
assert(modalResult.isConfigCommand === true, 'Modal popup width command recognized');
assert(modalResult.proposedChange?.category === 'modal', 'Category is modal');
assert(modalResult.proposedChange?.property === 'width', 'Property is width');
assert(modalResult.proposedChange?.proposedValue === 900, 'Proposed modal width is 900');

// 4.3 GIS Map Height
const gisResult = interpretSuperAdminConfigCommand('Make the GIS map height 700px', DEFAULT_MASTER_CONFIG);
assert(gisResult.isConfigCommand === true, 'GIS map height command recognized');
assert(gisResult.proposedChange?.category === 'layout', 'Category is layout');
assert(gisResult.proposedChange?.property === 'gisMapHeight', 'Property is gisMapHeight');
assert(gisResult.proposedChange?.proposedValue === 700, 'Proposed GIS height is 700');

// 5. NLP Config Interpreter - Feature Visibility & Branding
console.log('\n[5] NLP Config Interpreter - Feature Visibility & Branding');

// 5.1 Hide Feature
const hideResult = interpretSuperAdminConfigCommand('Hide Ready for Take-Off from Agent', DEFAULT_MASTER_CONFIG);
assert(hideResult.isConfigCommand === true, 'Feature hide command recognized');
assert(hideResult.proposedChange?.targetRole === 'agent', 'Target role is agent');
assert(hideResult.proposedChange?.category === 'feature', 'Category is feature');
assert(hideResult.proposedChange?.property === 'takeoff', 'Target feature is takeoff');
assert(hideResult.proposedChange?.proposedValue === false, 'Feature toggled to false');

// 5.2 Dashboard Title
const titleResult = interpretSuperAdminConfigCommand('Change the dashboard title to Southern Leyte Swine Hub', DEFAULT_MASTER_CONFIG);
assert(titleResult.isConfigCommand === true, 'Dashboard title command recognized');
assert(titleResult.proposedChange?.category === 'text', 'Category is text');
assert(titleResult.proposedChange?.property === 'menuLabels', 'Property is menuLabels');
assert(titleResult.proposedChange?.proposedValue === 'Southern Leyte Swine Hub', 'Title set correctly');

// 6. Master Config Service - State, Drafts, Snapshots, Audit Log
console.log('\n[6] Master Config Service Verification');

// Reset to default
masterConfigService.resetSectionToDefault('all', undefined, 'Test System');
const current = masterConfigService.getConfig();
assert(current.version === 1, 'Initial published version is 1');

// Update draft
const draft = masterConfigService.getDraftConfig();
draft.roles.admin.colors.sidebarColor = '#003C2F';
masterConfigService.saveDraft(draft);

// Publish changes
await masterConfigService.publishConfig('Super Admin', 'Updated admin sidebar color via NLP assistant');
const published = masterConfigService.getConfig();
assert(published.version === 2, 'Published version incremented to 2');

// Check audit log
const auditLogs = masterConfigService.getAuditLogs();
assert(auditLogs.length > 0, 'Audit log created');
assert(auditLogs[0].who === 'Super Admin', 'Audit log author recorded');

// Check version history
const versions = masterConfigService.getVersions();
assert(versions.length >= 2, 'Version history has at least 2 versions');

// Rollback / restore version 1
await masterConfigService.restoreVersion(1, 'Super Admin');
const restored = masterConfigService.getConfig();
assert(restored.version === 3, 'Restoring creates a new published version snapshot');
const auditLogsAfterRestore = masterConfigService.getAuditLogs();
assert(auditLogsAfterRestore[0].what.includes('Rollback') || auditLogsAfterRestore[0].what.includes('Restored') || auditLogsAfterRestore[0].what.includes('v1'), 'Audit log records restore action');

console.log(`\n========================================`);
console.log(`ALL ${passedTests} / ${totalTests} TESTS PASSED SUCCESSFULLY!`);
console.log(`========================================\n`);

