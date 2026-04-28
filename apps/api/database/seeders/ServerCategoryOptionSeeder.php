<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class ServerCategoryOptionSeeder extends Seeder
{
    public function run(): void
    {
        $now = now();
        $options = [
            // MLBB Zone ID options (server_category_id = 2)
            ['server_category_id'=>2,'name'=>'Zone 1','value'=>'2001','created_at'=>$now,'updated_at'=>$now],
            ['server_category_id'=>2,'name'=>'Zone 2','value'=>'2002','created_at'=>$now,'updated_at'=>$now],
            ['server_category_id'=>2,'name'=>'Zone 3','value'=>'2003','created_at'=>$now,'updated_at'=>$now],
            ['server_category_id'=>2,'name'=>'Zone 4','value'=>'2004','created_at'=>$now,'updated_at'=>$now],
            ['server_category_id'=>2,'name'=>'Zone 5','value'=>'2005','created_at'=>$now,'updated_at'=>$now],
            // Genshin Server (server_category_id = 4)
            ['server_category_id'=>4,'name'=>'Asia','value'=>'os_asia','created_at'=>$now,'updated_at'=>$now],
            ['server_category_id'=>4,'name'=>'America','value'=>'os_usa','created_at'=>$now,'updated_at'=>$now],
            ['server_category_id'=>4,'name'=>'Europe','value'=>'os_euro','created_at'=>$now,'updated_at'=>$now],
            ['server_category_id'=>4,'name'=>'TW/HK/MO','value'=>'os_cht','created_at'=>$now,'updated_at'=>$now],
            // HSR Server (server_category_id = 8)
            ['server_category_id'=>8,'name'=>'Production','value'=>'prod_gf_sg','created_at'=>$now,'updated_at'=>$now],
            ['server_category_id'=>8,'name'=>'Bilibili','value'=>'prod_gf_cn','created_at'=>$now,'updated_at'=>$now],
        ];

        DB::table('server_category_options')->insert($options);
    }
}
