from flask import Flask, send_file, request, jsonify
import subprocess
import json
import os
import tempfile
import yaml
from datetime import datetime
import re
from dotenv import load_dotenv

load_dotenv()

PORT = os.environ.get("PORT", 1337)
SECRET = os.environ.get("SECRET", "secret")
app = Flask(__name__)

def validate_template(template_content):
    """Validate Nuclei template YAML structure"""
    try:
        template = yaml.safe_load(template_content)
        
        # Basic validation
        if not isinstance(template, dict):
            return False, "Template must be a YAML object"
            
        if 'id' not in template:
            return False, "Template must have an 'id' field"
            
        if 'info' not in template:
            return False, "Template must have an 'info' field"
            
        # Check for potentially dangerous operations
        dangerous_patterns = [
            r'exec\s*:',
            r'shell\s*:',
            r'command\s*:',
            r'file\s*:.*\.\./\.\.',
        ]
        
        template_str = str(template_content).lower()
        for pattern in dangerous_patterns:
            if re.search(pattern, template_str):
                return False, f"Template contains potentially dangerous operations: {pattern}"
        
        return True, "Template is valid"
        
    except yaml.YAMLError as e:
        return False, f"Invalid YAML: {str(e)}"

def check_nuclei_installed():
    """Check if Nuclei is installed and accessible"""
    try:
        result = subprocess.run(['nuclei', '-version'], 
                              capture_output=True, text=True, timeout=10)
        return result.returncode == 0
    except (subprocess.TimeoutExpired, FileNotFoundError):
        return False

@app.route('/')
def index():
    return send_file("index.html")

@app.route('/scan', methods=['POST'])
def scan():
    try:
        # Check if Nuclei is installed
        if not check_nuclei_installed():
            return jsonify({
                'success': False, 
                'error': 'Nuclei is not installed or not accessible. Please install Nuclei first.'
            })
        
        port = request.form.get('port', '80')
        template_type = request.form.get('template_type', 'builtin')
        
        # Validate port
        try:
            port_num = int(port)
            if not (1 <= port_num <= 65535):
                raise ValueError()
        except ValueError:
            return jsonify({'success': False, 'error': 'Invalid port number'})
        
        # Build target URL (localhost only)
        target = f"http://127.0.0.1:{port}"
        
        # Build Nuclei command
        cmd = ['nuclei', '-target', target, '-jsonl', '--no-color']
        
        if template_type == 'custom':
            template_content = request.form.get('template_content', '').strip()
            if not template_content:
                return jsonify({'success': False, 'error': 'Custom template content is required'})
            
            # Validate custom template
            is_valid, validation_msg = validate_template(template_content)
            if not is_valid:
                return jsonify({'success': False, 'error': f'Template validation failed: {validation_msg}'})
            
            # Save custom template to temporary file
            with tempfile.NamedTemporaryFile(mode='w', suffix='.yaml', delete=False) as f:
                f.write(template_content)
                template_file = f.name
            
            cmd.extend(['-t', template_file])
        else:
            # Use built-in templates
            builtin_template = request.form.get('builtin_template', 'http/misconfiguration')
            admin_secret = request.headers.get('X-Secret')

            if admin_secret != SECRET and builtin_template not in [
                    "http/misconfiguration",
                    "http/technologies",
                    "http/vulnerabilities",
                    "ssl",
                    "dns"
                    ]:
                return jsonify({
                    'success': False,
                    'error': 'Only administrators may enter a non-allowlisted template.'
                })

            cmd.extend(['-t', builtin_template])
        
        # Add safety parameters
        cmd.extend([
            '-timeout', '30',
            '-retries', '1',
            '-rate-limit', '5'
        ])
        
        # Run Nuclei scan
        result = subprocess.run(cmd, capture_output=True, text=True, timeout=60)
        
        # Clean up temporary file if it exists
        if template_type == 'custom' and 'template_file' in locals():
            try:
                os.unlink(template_file)
            except OSError:
                pass
        
        # Process results
        if result.returncode == 0 or result.stdout:
            output_lines = []
            
            if result.stdout.strip():
                # Parse JSON output
                for line in result.stdout.strip().split('\n'):
                    if line.strip():
                        try:
                            finding = json.loads(line)
                            formatted_finding = f"""
🔍 Finding: {finding.get('info', {}).get('name', 'Unknown')}
📋 Template: {finding.get('template-id', 'N/A')}
🎯 Target: {finding.get('matched-at', 'N/A')}
⚠️  Severity: {finding.get('info', {}).get('severity', 'N/A')}
📝 Description: {finding.get('info', {}).get('description', 'N/A')}
🔗 Reference: {', '.join(finding.get('info', {}).get('reference', []))}
---"""
                            output_lines.append(formatted_finding)
                        except json.JSONDecodeError:
                            output_lines.append(f"Raw output: {line}")
            
            if not output_lines:
                output_lines.append("✅ No vulnerabilities or issues found.")
            
            if result.stderr:
                output_lines.append(f"\n⚠️ Warnings/Errors:\n{result.stderr}")
            
            return jsonify({
                'success': True,
                'output': '\n'.join(output_lines)
            })
        else:
            error_msg = result.stderr if result.stderr else "Scan completed with no output"
            return jsonify({
                'success': False,
                'error': error_msg
            })
            
    except subprocess.TimeoutExpired:
        return jsonify({
            'success': False,
            'error': 'Scan timed out. The target may be unresponsive.'
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'error': f'An error occurred: {str(e)}'
        })

if __name__ == '__main__':
    app.run("0.0.0.0", PORT)
