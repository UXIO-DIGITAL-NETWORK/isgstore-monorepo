<?php

declare(strict_types=1);

return [

    /*
    |--------------------------------------------------------------------------
    | Automatic image optimisation
    |--------------------------------------------------------------------------
    |
    | Every image that reaches the app through App\Services\ImageOptimizer is
    | re-encoded to WebP and capped to `max_dimension` on its longest edge.
    | Turning this off makes uploads store the original bytes again — useful
    | for diagnosing whether a rendering problem comes from the conversion.
    |
    */

    'enabled' => (bool) env('IMAGE_OPTIMIZE_ENABLED', true),

    /*
    | WebP encoder quality, 0-100. 82 is the point where the artefacts stop
    | being visible on photographic content while the file stays far below the
    | JPEG it replaced. Raise it before you raise `max_dimension`.
    */
    'quality' => (int) env('IMAGE_WEBP_QUALITY', 82),

    /*
    | Longest edge, in pixels. Images larger than this are scaled down; smaller
    | ones are never scaled up.
    */
    'max_dimension' => (int) env('IMAGE_MAX_DIMENSION', 1920),

    /*
    | Decompression-bomb guard. A file whose pixel count exceeds this is stored
    | untouched rather than decoded — a 100 MP PNG is a few hundred KB on disk
    | and several gigabytes in memory.
    */
    'max_megapixels' => (int) env('IMAGE_MAX_MEGAPIXELS', 50),

];
