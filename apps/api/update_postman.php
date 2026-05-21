<?php

$file = 'api-docs.json';
$data = json_decode(file_get_contents($file), true);

function processItems(&$items) {
    foreach ($items as &$item) {
        if (isset($item['item'])) {
            processItems($item['item']);
        }
        
        if (isset($item['request']) && isset($item['request']['url'])) {
            $url = &$item['request']['url'];
            
            if (isset($url['path']) && is_array($url['path'])) {
                $path = &$url['path'];
                
                // Specific overrides before adding v1
                $pathStr = implode('/', $path);
                if ($pathStr === 'webhook/digiflazz') {
                    $path = ['digiflazz', 'callback'];
                } elseif ($pathStr === 'monetapay/callback' || $pathStr === 'payments/monetapay/callback') {
                    $path = ['payment', 'callback'];
                }
                
                // Prepend v1 if not exists
                if (!empty($path) && $path[0] !== 'v1') {
                    array_unshift($path, 'v1');
                }
                
                // Reconstruct raw
                if (isset($url['raw'])) {
                    $base = '{{base_url}}';
                    $url['raw'] = $base . '/' . implode('/', $path);
                }
            }
        }
    }
}

if (isset($data['item'])) {
    processItems($data['item']);
}

file_put_contents($file, json_encode($data, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES));
echo "Successfully updated api-docs.json\n";

