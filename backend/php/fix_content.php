<?php
/**
 * Script to patch content.php with merge logic for home content
 * and fix the $mergedHome undefined variable bug.
 * Run once, then delete this file.
 */

$file = __DIR__ . '/api/content.php';
$content = file_get_contents($file);

if ($content === false) {
    echo "ERROR: Cannot read content.php\n";
    exit(1);
}

// -------------------------------------------------------
// FIX 1: Replace the home content encoding block
//        with merge logic (lines ~1033-1047)
// -------------------------------------------------------

$oldBlock = <<<'PHP'
            $homeJson =
                json_encode(
                    $homeData,
                    JSON_UNESCAPED_UNICODE |
                    JSON_UNESCAPED_SLASHES
                );


            if ($homeJson === false) {

                errorResponse(
                    'Unable to encode Home content.',
                    400
                );
            }
PHP;

$newBlock = <<<'PHP'
            // Retrieve existing home content for merging
            $existingHome = null;
            try {
                $stmtExisting = $pdo->query(
                    'SELECT content FROM home_content ORDER BY id DESC LIMIT 1'
                );
                $rowExisting = $stmtExisting->fetch(PDO::FETCH_ASSOC);
                if ($rowExisting && !empty($rowExisting['content'])) {
                    $existingHome = json_decode($rowExisting['content'], true);
                }
            } catch (Throwable $e) {
                $existingHome = null;
            }

            // Merge incoming with existing — incoming overrides
            $mergedHome = is_array($existingHome)
                ? array_replace_recursive($existingHome, $homeData)
                : $homeData;

            $homeJson = json_encode(
                $mergedHome,
                JSON_UNESCAPED_UNICODE |
                JSON_UNESCAPED_SLASHES
            );

            if ($homeJson === false) {
                errorResponse(
                    'Unable to encode Home content.',
                    400
                );
            }
PHP;

if (strpos($content, $oldBlock) !== false) {
    $content = str_replace($oldBlock, $newBlock, $content);
    echo "FIX 1 APPLIED: Home content merge logic added.\n";
} else {
    // Try without the double blank line
    $oldBlockAlt = <<<'PHP'
            $homeJson =
                json_encode(
                    $homeData,
                    JSON_UNESCAPED_UNICODE |
                    JSON_UNESCAPED_SLASHES
                );

            if ($homeJson === false) {

                errorResponse(
                    'Unable to encode Home content.',
                    400
                );
            }
PHP;
    if (strpos($content, $oldBlockAlt) !== false) {
        $content = str_replace($oldBlockAlt, $newBlock, $content);
        echo "FIX 1 APPLIED (alt): Home content merge logic added.\n";
    } else {
        echo "FIX 1 SKIPPED: Could not find target block. May already be patched.\n";
        // Debug: show what's around the area
        $pos = strpos($content, '$homeJson');
        if ($pos !== false) {
            echo "DEBUG: Found \$homeJson at position $pos\n";
            echo "CONTEXT: " . substr($content, $pos - 20, 200) . "\n";
        }
    }
}

// -------------------------------------------------------
// FIX 2: Ensure $saved['home'] uses $mergedHome
//        (it already references $mergedHome, which is now defined)
// -------------------------------------------------------

if (strpos($content, "\$saved['home'] =\n                \$mergedHome;") !== false) {
    echo "FIX 2 OK: \$saved['home'] already uses \$mergedHome (now defined).\n";
} elseif (strpos($content, "\$saved['home'] = \$mergedHome;") !== false) {
    echo "FIX 2 OK: \$saved['home'] already uses \$mergedHome (now defined).\n";
} else {
    echo "FIX 2 INFO: Could not find \$saved['home'] = \$mergedHome reference.\n";
}

// Write patched file
if (file_put_contents($file, $content) !== false) {
    echo "\nPatched file written successfully.\n";
    echo "File size: " . strlen($content) . " bytes\n";
} else {
    echo "\nERROR: Failed to write patched file!\n";
    exit(1);
}
