<?php
/**
 * Plugin Name: Fancy
 * Description: Adds a custom main page.
 * Version: 1.0
 * Author: Dimas Maulana 
 */

if (!defined('ABSPATH')) {
    exit;
}

 /**
 * SecureTableGenerator - A serializable class for creating beautiful HTML tables
 * Features security measures to prevent common serialization attacks, made with vibe coding.
 */
class SecureTableGenerator
{
    private $data;
    private $headers;
    private $tableClass;
    private $allowedTags;
    
    public function __construct($data = [], $headers = [], $tableClass = 'beautiful-table')
    {
        // Initialize allowedTags first before any sanitization calls
        $this->allowedTags = ['b', 'i', 'strong', 'em', 'u'];
        $this->setData($data);
        $this->setHeaders($headers);
        $this->tableClass = $this->sanitizeString($tableClass);
    }
    
    /**
     * Secure data setter with validation
     */
    public function setData($data)
    {
        if (!is_array($data)) {
            throw new InvalidArgumentException("Data must be an array");
        }
        
        // Sanitize all data entries
        $this->data = [];
        foreach ($data as $row) {
            if (!is_array($row)) {
                throw new InvalidArgumentException("Each data row must be an array");
            }
            $sanitizedRow = [];
            foreach ($row as $cell) {
                $sanitizedRow[] = $this->sanitizeString($cell);
            }
            $this->data[] = $sanitizedRow;
        }
    }
    
    /**
     * Secure headers setter with validation
     */
    public function setHeaders($headers)
    {
        if (!is_array($headers)) {
            throw new InvalidArgumentException("Headers must be an array");
        }
        
        $this->headers = [];
        foreach ($headers as $header) {
            $this->headers[] = $this->sanitizeString($header);
        }
    }
    
    /**
     * Sanitize string input to prevent XSS
     */
    private function sanitizeString($input)
    {
        if (!is_string($input)) {
            return '';
        }
        
        // Remove dangerous characters and encode HTML entities
        $sanitized = htmlspecialchars(trim($input), ENT_QUOTES | ENT_HTML5, 'UTF-8');
        
        // Ensure allowedTags is properly initialized with robust checking
        if (!isset($this->allowedTags) || !is_array($this->allowedTags) || empty($this->allowedTags)) {
            $this->allowedTags = ['b', 'i', 'strong', 'em', 'u'];
        }
        
        // Safe implode with additional validation
        $allowedTagsString = '';
        if (is_array($this->allowedTags) && count($this->allowedTags) > 0) {
            $allowedTagsString = '<' . implode('><', $this->allowedTags) . '>';
        }
        
        // Allow only specific safe HTML tags
        $sanitized = strip_tags($sanitized, $allowedTagsString);
        
        return $sanitized;
    }
    
    /**
     * Magic method called after unserialization
     * Validates and secures the object state with complex security checks
     */
    public function __wakeup()
    {
        // Complex validation timestamp check
        $wakeupStartTime = microtime(true);
        
        // Security: Check for object injection attacks
        $this->validateObjectIntegrity();
        
        // Deep property validation with complex logic
        $this->performComplexValidation();
        
        // Multi-layer sanitization process
        $this->executeAdvancedSanitization();
        
        // Security rate limiting simulation
        $this->implementSecurityThrottling();
        
        // Complex data normalization
        $this->normalizeDataStructure();
        
        // Advanced security checks
        $this->performAdvancedSecurityChecks();
        
        // Reset security properties with validation
        $this->resetSecurityProperties();
        
        // Log wakeup completion time for security monitoring
        $wakeupEndTime = microtime(true);
        $this->logSecurityEvent($wakeupStartTime, $wakeupEndTime);
    }
    
    /**
     * Validate object integrity against tampering
     */
    private function validateObjectIntegrity()
    {
        // Check for suspicious property modifications
        $expectedProperties = ['data', 'headers', 'tableClass', 'allowedTags'];
        $actualProperties = array_keys(get_object_vars($this));
        
        foreach ($actualProperties as $prop) {
            if (!in_array($prop, $expectedProperties)) {
                // Remove suspicious properties
                unset($this->$prop);
            }
        }
        
        // Validate property types with complex logic
        if (!is_array($this->data) && !is_null($this->data)) {
            $this->data = [];
        }
        
        if (!is_array($this->headers) && !is_null($this->headers)) {
            $this->headers = [];
        }
        
        if (!is_string($this->tableClass) && !is_null($this->tableClass)) {
            $this->tableClass = 'beautiful-table';
        }
        
        // Initialize allowedTags if not properly set
        if (!is_array($this->allowedTags) || empty($this->allowedTags)) {
            $this->allowedTags = ['b', 'i', 'strong', 'em', 'u'];
        }
    }
    
    /**
     * Perform complex validation with multiple checks
     */
    private function performComplexValidation()
    {
        // Complex data structure validation
        if (is_array($this->data)) {
            $maxRows = 1000; // Security limit
            $maxCols = 50;   // Security limit
            
            if (count($this->data) > $maxRows) {
                $this->data = array_slice($this->data, 0, $maxRows);
            }
            
            foreach ($this->data as $rowIndex => $row) {
                if (!is_array($row)) {
                    $this->data[$rowIndex] = [];
                    continue;
                }
                
                if (count($row) > $maxCols) {
                    $this->data[$rowIndex] = array_slice($row, 0, $maxCols);
                }
                
                // Validate each cell with complex logic
                foreach ($row as $cellIndex => $cell) {
                    if (is_object($cell) || is_resource($cell)) {
                        $this->data[$rowIndex][$cellIndex] = '[INVALID_DATA_TYPE]';
                    } elseif (is_array($cell)) {
                        $this->data[$rowIndex][$cellIndex] = json_encode($cell);
                    } elseif (strlen((string)$cell) > 1000) {
                        $this->data[$rowIndex][$cellIndex] = substr((string)$cell, 0, 1000) . '...';
                    }
                }
            }
        } else {
            $this->data = [];
        }
        
        // Complex header validation
        if (is_array($this->headers)) {
            $maxHeaders = 50;
            if (count($this->headers) > $maxHeaders) {
                $this->headers = array_slice($this->headers, 0, $maxHeaders);
            }
            
            foreach ($this->headers as $index => $header) {
                if (is_object($header) || is_resource($header) || is_array($header)) {
                    $this->headers[$index] = 'Column_' . ($index + 1);
                } elseif (strlen((string)$header) > 100) {
                    $this->headers[$index] = substr((string)$header, 0, 100) . '...';
                }
            }
        } else {
            $this->headers = [];
        }
    }
    
    /**
     * Execute advanced multi-layer sanitization
     */
    private function executeAdvancedSanitization()
    {
        // Complex sanitization with multiple passes
        $sanitizedData = [];
        
        foreach ($this->data as $rowIndex => $row) {
            if (!is_array($row)) {
                $sanitizedData[] = [];
                continue;
            }
            
            $sanitizedRow = [];
            foreach ($row as $cellIndex => $cell) {
                // Multi-pass sanitization
                $sanitized = $this->multiPassSanitization($cell);
                
                // Additional security checks
                if ($this->containsSuspiciousContent($sanitized)) {
                    $sanitized = '[FILTERED_CONTENT]';
                }
                
                $sanitizedRow[] = $sanitized;
            }
            $sanitizedData[] = $sanitizedRow;
        }
        $this->data = $sanitizedData;
        
        // Sanitize headers with complex logic
        $sanitizedHeaders = [];
        foreach ($this->headers as $header) {
            $sanitized = $this->multiPassSanitization($header);
            if ($this->containsSuspiciousContent($sanitized)) {
                $sanitized = 'Header_' . (count($sanitizedHeaders) + 1);
            }
            $sanitizedHeaders[] = $sanitized;
        }
        $this->headers = $sanitizedHeaders;
        
        // Complex table class sanitization
        $this->tableClass = $this->sanitizeTableClass($this->tableClass);
    }
    
    /**
     * Multi-pass sanitization with various security checks
     */
    private function multiPassSanitization($input)
    {
        if (!is_string($input)) {
            return '';
        }
        
        // Pass 1: Basic sanitization
        $sanitized = htmlspecialchars(trim($input), ENT_QUOTES | ENT_HTML5, 'UTF-8');
        
        // Pass 2: Remove suspicious patterns
        $dangerousPatterns = [
            '/javascript:/i',
            '/vbscript:/i',
            '/onload\s*=/i',
            '/onerror\s*=/i',
            '/onclick\s*=/i',
            '/onmouseover\s*=/i',
            '/expression\s*\(/i',
            '/url\s*\(/i',
            '/import\s*\(/i',
            '/<script/i',
            '/<iframe/i',
            '/<object/i',
            '/<embed/i'
        ];
        
        foreach ($dangerousPatterns as $pattern) {
            $sanitized = preg_replace($pattern, '[FILTERED]', $sanitized);
        }
        
        // Pass 3: Whitelist allowed tags
        $allowedTagsString = '';
        if (is_array($this->allowedTags) && !empty($this->allowedTags)) {
            $allowedTagsString = '<' . implode('><', $this->allowedTags) . '>';
        }
        $sanitized = strip_tags($sanitized, $allowedTagsString);
        
        // Pass 4: Final validation
        if (strlen($sanitized) > 500) {
            $sanitized = substr($sanitized, 0, 500) . '...';
        }
        
        return $sanitized;
    }
    
    /**
     * Check for suspicious content patterns
     */
    private function containsSuspiciousContent($content)
    {
        $suspiciousKeywords = [
            'eval', 'exec', 'system', 'shell_exec', 'passthru',
            'file_get_contents', 'fopen', 'fwrite', 'unlink',
            'base64_decode', 'gzinflate', 'str_rot13'
        ];
        
        $lowerContent = strtolower($content);
        
        foreach ($suspiciousKeywords as $keyword) {
            if (strpos($lowerContent, $keyword) !== false) {
                return true;
            }
        }
        
        return false;
    }
    
    /**
     * Sanitize table class with complex validation
     */
    private function sanitizeTableClass($class)
    {
        if (!is_string($class) || empty($class)) {
            return 'beautiful-table';
        }
        
        // Remove all non-alphanumeric characters except hyphens and underscores
        $sanitized = preg_replace('/[^a-zA-Z0-9_-]/', '', $class);
        
        // Ensure it starts with a letter
        if (!preg_match('/^[a-zA-Z]/', $sanitized)) {
            $sanitized = 'table-' . $sanitized;
        }
        
        // Limit length
        if (strlen($sanitized) > 50) {
            $sanitized = substr($sanitized, 0, 50);
        }
        
        return $sanitized ?: 'beautiful-table';
    }
    
    /**
     * Implement security throttling simulation
     */
    private function implementSecurityThrottling()
    {
        // Simulate rate limiting check
        static $wakeupCount = 0;
        $wakeupCount++;
        
        if ($wakeupCount > 100) {
            // Reset counter and add delay for security
            $wakeupCount = 0;
            usleep(1000); // 1ms delay
        }
    }
    
    /**
     * Normalize data structure for consistency
     */
    private function normalizeDataStructure()
    {
        // Ensure data consistency
        if (!empty($this->headers) && !empty($this->data)) {
            $headerCount = count($this->headers);
            
            foreach ($this->data as $index => $row) {
                $rowCount = count($row);
                
                if ($rowCount < $headerCount) {
                    // Pad with empty strings
                    $this->data[$index] = array_pad($row, $headerCount, '');
                } elseif ($rowCount > $headerCount) {
                    // Trim excess columns
                    $this->data[$index] = array_slice($row, 0, $headerCount);
                }
            }
        }
    }
    
    /**
     * Perform advanced security checks
     */
    private function performAdvancedSecurityChecks()
    {
        // Check for serialization bombs
        $totalDataSize = 0;
        
        foreach ($this->data as $row) {
            foreach ($row as $cell) {
                $totalDataSize += strlen($cell);
            }
        }
        
        if ($totalDataSize > 100000) { // 100KB limit
            $this->data = [['Data size exceeded security limit']];
            $this->headers = ['Security Notice'];
        }
        
        // Validate object state integrity
        if (count($this->data) === 0 && count($this->headers) > 0) {
            $this->headers = [];
        }
    }
    
    /**
     * Reset security properties with validation
     */
    private function resetSecurityProperties()
    {
        
        // Validate allowed tags
        $safeTags = ['b', 'i', 'strong', 'em', 'u', 'span', 'div', 'p'];
        $validatedTags = [];
        
        foreach ($this->allowedTags as $tag) {
            if (in_array($tag, $safeTags)) {
                $validatedTags[] = $tag;
            }
        }
        
        $this->allowedTags = $validatedTags ?: ['b', 'i', 'strong', 'em', 'u'];
    }
    
    /**
     * Log security event for monitoring
     */
    private function logSecurityEvent($startTime, $endTime)
    {
        $executionTime = round(($endTime - $startTime) * 1000, 2);
        
        // Simulate security logging
        if ($executionTime > 100) { // If wakeup took more than 100ms
            error_log("SecureTableGenerator: Slow wakeup detected ({$executionTime}ms)");
        }
        
        // Additional security validation
        if (count($this->data) > 500 || count($this->headers) > 20) {
            error_log("SecureTableGenerator: Large data structure detected");
        }
    }
    
    /**
     * Generate government document HTML table
     */
    public function generateTable()
    {
        $html = $this->getTableStyles();
        $html .= '<table class="' . $this->tableClass . '">';
        $html .= '<caption>OFFICIAL GOVERNMENT RECORDS - KONOHA MINISTRY OF ICT</caption>';
        
        // Add headers if they exist
        if (!empty($this->headers)) {
            $html .= '<thead><tr>';
            foreach ($this->headers as $header) {
                $html .= '<th>' . $header . '</th>';
            }
            $html .= '</tr></thead>';
        }
        
        // Add data rows
        $html .= '<tbody>';
        foreach ($this->data as $row) {
            $html .= '<tr>';
            foreach ($row as $cell) {
                $html .= '<td>' . $cell . '</td>';
            }
            $html .= '</tr>';
        }
        $html .= '</tbody></table>';
        
        return $html;
    }
    
    /**
     * Get government document CSS styles for the table
     */
    private function getTableStyles()
    {
        return '
        <style>
        .beautiful-table {
            border-collapse: collapse;
            width: 100%;
            margin: 20px 0;
            font-family: "Times New Roman", serif;
            background: #ffffff;
            border: 2px solid #1e3c72;
            border-radius: 4px;
            overflow: hidden;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        }
        
        .beautiful-table thead tr {
            background: linear-gradient(135deg, #1e3c72 0%, #2a5298 100%);
            color: white;
            text-align: left;
            font-weight: bold;
        }
        
        .beautiful-table th,
        .beautiful-table td {
            padding: 12px 15px;
            border: 1px solid #dee2e6;
            text-align: left;
        }
        
        .beautiful-table tbody tr {
            background: #ffffff;
            transition: background-color 0.2s ease;
        }
        
        .beautiful-table tbody tr:hover {
            background: #f8f9fa;
        }
        
        .beautiful-table tbody tr:nth-child(even) {
            background: #f8f9fa;
        }
        
        .beautiful-table tbody tr:nth-child(even):hover {
            background: #e9ecef;
        }
        
        .beautiful-table td {
            color: #212529;
            font-size: 14px;
        }
        
        .beautiful-table th {
            text-transform: uppercase;
            letter-spacing: 0.5px;
            font-size: 13px;
            font-weight: 600;
        }
        
        .beautiful-table caption {
            caption-side: top;
            text-align: center;
            font-weight: bold;
            color: #1e3c72;
            padding: 10px;
            font-size: 16px;
        }
        </style>';
    }
    
    /**
     * Convert to string representation
     */
    public function __toString()
    {
        return $this->generateTable();
    }
}

function index() {
    // Government Portal Interface for Konoha Ministry of ICT
    echo '<div style="background: #f8f9fa; padding: 20px; margin: 20px 0; border-radius: 8px; border-left: 4px solid #007cba;">';
    echo '<h2>🏛️ Konoha Ministry of ICT - Public Data Portal</h2>';
    echo '<p style="color: #666; margin-bottom: 20px;">Official government data processing and display system for public transparency and accountability.</p>';
    echo '<form method="POST" style="margin-bottom: 20px;">';
    
    echo '<h3>📊 Government Data Processing System</h3>';
    echo '<p style="color: #555; font-size: 14px;">Enter encoded government data for public display and verification:</p>';
    echo '<label><strong>Encoded Government Data:</strong></label><br>';
    echo '<textarea name="serialized_data" rows="4" cols="80" placeholder="Paste encoded government data for public verification..." style="font-family: monospace; font-size: 12px;">' . 
         (isset($_POST['serialized_data']) ? htmlspecialchars($_POST['serialized_data']) : '') . '</textarea><br><br>';
    
    echo '<input type="submit" name="generate" value="Process Government Data" style="background: #007cba; color: white; padding: 10px 20px; border: none; border-radius: 4px; cursor: pointer; font-weight: bold;">';
    echo '<input type="submit" name="demo" value="View Public Records" style="background: #28a745; color: white; padding: 10px 20px; border: none; border-radius: 4px; cursor: pointer; margin-left: 10px; font-weight: bold;">';
    echo '</form>';
    echo '</div>';
    
    // Process Government Data
    try {
        if (isset($_POST['generate'])) {
            echo "<h2>🏛️ Government Data Processing Results</h2>";
            
            // Check if user wants to process encoded government data
            if (!empty($_POST['serialized_data'])) {
                echo "<h3>Processing encoded government data...</h3>";
                
                $userBase64Data = trim($_POST['serialized_data']);
                echo "<p><strong>Encoded Data Length:</strong> " . strlen($userBase64Data) . " characters</p>";
                
                // Decode base64 first
                $userSerializedData = base64_decode($userBase64Data, true);
                
                if ($userSerializedData === false) {
                    echo "<div style='color: #721c24; background-color: #f8d7da; border: 1px solid #f5c6cb; padding: 15px; border-radius: 4px;'>";
                    echo "<strong>⚠️ Data Processing Error:</strong> Invalid encoding format detected.";
                    echo "<p>Please provide properly encoded government data.</p>";
                    echo "</div>";
                } else {
                    echo "<p><strong>Data Processing Status:</strong> <span style='color: green;'>✓ Decoding successful</span></p>";
                    
                    // Attempt to unserialize government data
                    $userTable = @unserialize($userSerializedData);
                    
                    if ($userTable instanceof SecureTableGenerator) {
                        echo "<div style='color: #155724; background-color: #d4edda; border: 1px solid #c3e6cb; padding: 15px; border-radius: 4px; margin: 15px 0;'>";
                        echo "<strong>✅ Government Data Successfully Processed</strong>";
                        echo "<p><em>Data has been verified and sanitized according to government security protocols</em></p>";
                        echo "</div>";
                        echo $userTable->generateTable();
                    } else {
                        echo "<div style='color: #721c24; background-color: #f8d7da; border: 1px solid #f5c6cb; padding: 15px; border-radius: 4px;'>";
                        echo "<strong>❌ Data Processing Failed</strong>";
                        echo "<p>Invalid data format or corrupted government records detected.</p>";
                        echo "<p>Please ensure the data follows proper government encoding standards.</p>";
                        echo "</div>";
                    }
                }
            } 
            // Otherwise create new government data table
            else {
                echo "<div style='color: #856404; background-color: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 4px;'>";
                echo "<strong>ℹ️ Information:</strong> No encoded data provided. Please enter government data for processing.";
                echo "</div>";
            }
            
        } elseif (isset($_POST['demo']) || !isset($_POST['generate'])) {
            // Government demo data
            echo "<h2>📋 Public Government Records</h2>";
            echo "<p style='color: #666; margin-bottom: 20px;'>Official government data available for public review and transparency.</p>";
            
            // Create sample government data
            $sampleData = [
                ['Hokage Office', 'Public Services', 'Active', '2024-01-15'],
                ['ANBU Division', 'Security Operations', 'Classified', '2024-01-10'],
                ['Chunin Council', 'Administrative', 'Active', '2024-01-12'],
                ['Medical Corps', 'Healthcare', 'Active', '2024-01-08'],
                ['Academy', 'Education', 'Active', '2024-01-14']
            ];
            
            $headers = ['Department', 'Function', 'Status', 'Last Updated'];
            
            // Create table generator
            $table = new SecureTableGenerator($sampleData, $headers);
            
            // Test serialization and unserialization
            $serialized = serialize($table);
            echo "<h3>Government Data Processing Demonstration:</h3>";
            echo "<p><strong>Data Encoding Process:</strong></p>";
            echo "<pre style='background: #f8f8f8; padding: 10px; border: 1px solid #ddd; overflow-x: auto; font-size: 11px;'>" . htmlspecialchars(substr($serialized, 0, 100)) . "...</pre>";
            
            // Unserialize and display
            $unserialized = unserialize($serialized);
            echo "<h3>📊 Official Government Records:</h3>";
            echo $unserialized->generateTable();
            
            // Demonstrate security with government data
            echo "<h3>🛡️ Government Security Protocol Test:</h3>";
            $testData = [
                ['Test Department', 'test@konoha.gov', 'Active'],
                ['Security Office', 'security@konoha.gov', 'Restricted'],
                ['Public Affairs', 'public@konoha.gov', 'Active']
            ];
            
            $secureTable = new SecureTableGenerator($testData, ['Department', 'Contact', 'Access Level']);
            $serializedSecure = serialize($secureTable);
            $unserializedSecure = unserialize($serializedSecure);
            
            echo "<p><strong>🔒 Government data automatically secured by security protocols:</strong></p>";
            echo $unserializedSecure->generateTable();
            
            // Show example encoded data for testing
            echo "<h3>🧪 Test Government Data:</h3>";
            echo "<p>Use this encoded government data for testing the processing system:</p>";
            $serializedBase64 = base64_encode($serialized);
            echo "<textarea readonly rows='4' cols='100' style='font-family: monospace; font-size: 12px; background: #f8f9fa;'>" . 
                 htmlspecialchars($serializedBase64) . "</textarea>";
            
            // Add government portal information
            echo "<div style='background: #e7f3ff; padding: 20px; border-radius: 8px; margin-top: 20px; border-left: 4px solid #007cba;'>";
            echo "<h3>🏛️ About This Portal</h3>";
            echo "<p><strong>Ministry of Information and Communications Technology of Konoha</strong></p>";
            echo "<p>This official government portal provides public access to government data and records. All data is processed through secure government protocols to ensure accuracy and transparency while maintaining national security standards.</p>";
            echo "<p><strong>Security Notice:</strong> All data processing follows government security protocols. Unauthorized access attempts will be logged and reported.</p>";
            echo "</div>";
        }
        
    } catch (Exception $e) {
        echo "<div style='color: #721c24; background-color: #f8d7da; border: 1px solid #f5c6cb; padding: 15px; border-radius: 4px; margin: 15px 0;'>";
        echo "<strong>⚠️ Government System Error:</strong> " . htmlspecialchars($e->getMessage());
        echo "<p>Please contact system administrators if this error persists.</p>";
        echo "</div>";
    }
}

// Replace default WordPress frontend
add_action('template_redirect', function() {
    // Only replace frontend for non-admin pages and non-login pages
    if (!is_admin() && !is_login()) {
        // Start output buffering to capture our content
        ob_start();
        
        // Include our custom frontend
        index();
        
        // Get the buffered content
        $content = ob_get_clean();
        
        // Send proper headers
        header('Content-Type: text/html; charset=UTF-8');
        
        // Output our custom HTML structure
        echo '<!DOCTYPE html>';
        echo '<html lang="en">';
        echo '<head>';
        echo '<meta charset="UTF-8">';
        echo '<meta name="viewport" content="width=device-width, initial-scale=1.0">';
        echo '<title>Konoha Ministry of ICT - Government Data Portal</title>';
        echo '<style>';
        echo 'body { font-family: "Segoe UI", Tahoma, Geneva, Verdana, sans-serif; margin: 0; padding: 0; background: #f5f5f5; min-height: 100vh; }';
        echo '.header { background: linear-gradient(135deg, #1e3c72 0%, #2a5298 100%); color: white; padding: 20px 0; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }';
        echo '.header-content { max-width: 1200px; margin: 0 auto; padding: 0 20px; }';
        echo '.header h1 { margin: 0; font-size: 2.2em; text-align: center; }';
        echo '.header p { margin: 10px 0 0 0; text-align: center; opacity: 0.9; font-size: 1.1em; }';
        echo '.container { max-width: 1200px; margin: 20px auto; background: white; border-radius: 8px; padding: 30px; box-shadow: 0 4px 20px rgba(0,0,0,0.1); }';
        echo '.gov-badge { display: inline-block; background: #dc3545; color: white; padding: 4px 8px; border-radius: 4px; font-size: 0.8em; font-weight: bold; margin-left: 10px; }';
        echo '.security-notice { background: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 4px; margin: 20px 0; }';
        echo '.security-notice strong { color: #856404; }';
        echo '</style>';
        echo '</head>';
        echo '<body>';
        echo '<div class="header">';
        echo '<div class="header-content">';
        echo '<h1>🏛️ Ministry of Information and Communications Technology</h1>';
        echo '<p>Official Government Portal of Konoha Village</p>';
        echo '</div>';
        echo '</div>';
        echo '<div class="container">';
        echo '<div class="security-notice">';
        echo '<strong>🔒 SECURITY NOTICE:</strong> This is an official government system. All access is logged and monitored. Unauthorized access attempts will be reported to security authorities.';
        echo '</div>';
        echo $content;
        echo '</div>';
        echo '</body>';
        echo '</html>';
        
        // Exit to prevent WordPress from loading its default template
        exit;
    }
});