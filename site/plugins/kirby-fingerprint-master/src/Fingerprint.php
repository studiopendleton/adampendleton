<?php

namespace bvdputte;
use Kirby\Cms\App;
use Kirby\Http\Url;

class Fingerprint
{
    public static function addHash($path)
    {
        if (Url::isAbsolute($path)) {

            if (Url::toObject()->host() !== Url::toObject($path)->host()) {
                return $path;
            }

            $path = Url::path($path);
        }

        if ( ! file_exists($path) || count($pathinfo = pathinfo($path)) < 4) {
            return $path;
        }

        if(option('bvdputte.fingerprint.disabled')) {
            $basename = $pathinfo['filename'] . '.' . $pathinfo['extension'];
        } else {
                $basename = $pathinfo['filename'] . '.' . $pathinfo['extension'] . '?v=' . md5_file($path);
          }

        return $pathinfo['dirname'] . '/' . $basename;
    }
}
