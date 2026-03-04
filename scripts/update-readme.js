import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

const README_PATH = path.join(process.cwd(), 'README.md');
const START_TAG = '<!-- CHANGELOG START -->';
const END_TAG = '<!-- CHANGELOG END -->';

function getLatestCommit() {
    try {
        // Get the latest commit hash, date, and subject
        const command = 'git log -1 --format="%h|%cd|%s" --date=short';
        const output = execSync(command).toString().trim();
        const [hash, date, subject] = output.split('|');

        // Ignore commits that are just automated README updates to avoid loops
        if (subject.includes('docs: auto-update README changelog')) {
            console.log('Skipping auto-update commit.');
            return null;
        }

        return { hash, date, subject };
    } catch (err) {
        console.error('Error fetching git log:', err);
        return null;
    }
}

function updateReadme() {
    const commit = getLatestCommit();
    if (!commit) return;

    try {
        const readmeContent = fs.readFileSync(README_PATH, 'utf8');

        if (!readmeContent.includes(START_TAG) || !readmeContent.includes(END_TAG)) {
            console.error('Changelog tags not found in README.md');
            process.exit(1);
        }

        const startIdx = readmeContent.indexOf(START_TAG) + START_TAG.length;
        const endIdx = readmeContent.indexOf(END_TAG);

        const before = readmeContent.slice(0, startIdx);
        const after = readmeContent.slice(endIdx);
        const existingChangelog = readmeContent.slice(startIdx, endIdx).trim();

        // Format new entry
        const newEntry = `- **${commit.date}** (${commit.hash}): ${commit.subject}`;

        // Prepend new entry, keep only top 10 to avoid massive files
        const allEntries = [newEntry, ...existingChangelog.split('\n').filter(line => line.trim().startsWith('-'))]
            .slice(0, 10)
            .join('\n');

        const updatedContent = `${before}\n${allEntries}\n${after}`;

        fs.writeFileSync(README_PATH, updatedContent, 'utf8');
        console.log('README.md updated successfully with:', commit.subject);

    } catch (err) {
        console.error('Error updating README:', err);
        process.exit(1);
    }
}

updateReadme();
