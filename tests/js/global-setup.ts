import { execFileSync } from 'node:child_process';
import { writeFileSync } from 'node:fs';

/** Dumps lang/{fr,en}/ui.php to JSON so component tests use the real UI strings (no duplicated fixtures). */
export default function setup() {
    const php = `echo json_encode(['fr' => require 'lang/fr/ui.php', 'en' => require 'lang/en/ui.php'], JSON_UNESCAPED_UNICODE);`;
    const json = execFileSync('php', ['-r', php], { cwd: process.cwd() }).toString();
    writeFileSync('tests/js/fixtures/translations.json', json);
}
