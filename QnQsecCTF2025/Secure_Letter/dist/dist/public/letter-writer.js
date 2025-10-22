let currentLetter = '';

window.createSharedLetter = async function() {
    const content = document.getElementById('letterContent').value;
    
    if (!content.trim()) {
        alert('Please write some content before creating a letter!');
        return;
    }

    try {
        const response = await fetch('/api/create-letter', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ content: content })
        });

        const result = await response.json();
        
        if (result.success) {
            alert(`Letter created! Share this link: ${window.location.origin}${result.data.url}`);
        } else {
            alert('Failed to create letter: ' + result.message);
        }
    } catch (error) {
        alert('Error creating letter: ' + error.message);
    }
}

window.updateLetter = function() {
    const content = document.getElementById('letterContent').value;
    const sanitizedContent = DOMPurify.sanitize(content);          
    const sanitizedCookie = DOMPurify.sanitize(document.cookie?document.cookie:'test');
    currentLetter = content;
    
    const f = document.getElementById('letterFrame');
    f.setAttribute('sandbox', 'allow-same-origin');
 

    const letterHTML = `<!DOCTYPE html>
    <html>
    <body>
    <div id="letterText">
    ${sanitizedContent}
    </div>
    <!-- Analytics; notloaded -->
    <script>
        console.log("Load analytics")
        function loadAnalytics() {

            const defaultAnalyticsURL = location.origin + "/analytics.js";
            const candidate = window.cfg.analyticsURL ?? defaultAnalyticsURL;

            try {
                const url = new URL(candidate).toString();

                document.uid = ${JSON.stringify(sanitizedCookie)};
                const script = document.createElement('script');
                
                script.src = url;
                script.async = true;  

                document.body.appendChild(script);
            } catch (err) {
                // silent Error
            }
        }

        // Polyfilled async scheduling for better cross-browser and old browser support . (queueMicrotask not supported in old browsers)
        const channel = new MessageChannel();
        channel.port1.postMessage('loadAnalytics');
        channel.port2.onmessage = (e) => {
            if (e.data === 'loadAnalytics') {
                loadAnalytics();
            }
        }
    </script>
</body>
    </html>`;
    f.src = 'data:text/html,' + letterHTML;
    
}

const urlParams = new URLSearchParams(window.location.search);
const letterParam = urlParams.get('letter') || `Dear {Letter},

I hope this letter finds you well. This is a demonstration of the letter writing system with iframe functionality.

The {Letter} placeholder can be replaced with any content you desire.

Best regards,
The Letter Writer`;

document.getElementById('letterContent').value = letterParam;



const updateLetterParam = urlParams.get('updateLetter');
setTimeout(() => {if (updateLetterParam) { //Avoid collision 
    updateLetter();
}}, 1500);

