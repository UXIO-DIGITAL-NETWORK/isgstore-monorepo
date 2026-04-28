<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class ServerCategorySeeder extends Seeder
{
    public function run(): void
    {
        $now = now();
        $items = [
            ['category_id'=>1,'name'=>'User ID','created_at'=>$now,'updated_at'=>$now],
            ['category_id'=>1,'name'=>'Zone ID','created_at'=>$now,'updated_at'=>$now],
            ['category_id'=>2,'name'=>'UID','created_at'=>$now,'updated_at'=>$now],
            ['category_id'=>2,'name'=>'Server','created_at'=>$now,'updated_at'=>$now],
            ['category_id'=>3,'name'=>'Player ID','created_at'=>$now,'updated_at'=>$now],
            ['category_id'=>4,'name'=>'Player ID','created_at'=>$now,'updated_at'=>$now],
            ['category_id'=>5,'name'=>'UID','created_at'=>$now,'updated_at'=>$now],
            ['category_id'=>5,'name'=>'Server','created_at'=>$now,'updated_at'=>$now],
            ['category_id'=>6,'name'=>'Player ID','created_at'=>$now,'updated_at'=>$now],
            ['category_id'=>7,'name'=>'Player Tag','created_at'=>$now,'updated_at'=>$now],
            ['category_id'=>8,'name'=>'Username','created_at'=>$now,'updated_at'=>$now],
            ['category_id'=>9,'name'=>'Riot ID','created_at'=>$now,'updated_at'=>$now],
            ['category_id'=>9,'name'=>'Tagline','created_at'=>$now,'updated_at'=>$now],
        ];

        DB::table('server_categories')->insert($items);
    }
}
