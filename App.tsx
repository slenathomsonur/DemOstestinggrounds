import React, { useState, useCallback, useEffect, useRef } from 'react';
import { generateCode } from './services/geminiService';

const RobotIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 2a2 2 0 0 1 2 2v2h-4V4a2 2 0 0 1 2-2zM6 8v10c0 1.1.9 2 2 2h8a2 2 0 0 0 2-2V8H6zm6 5a1 1 0 1 1-2 0 1 1 0 0 1 2 0zm-4 0a1 1 0 1 1-2 0 1 1 0 0 1 2 0zm8 0a1 1 0 1 1-2 0 1 1 0 0 1 2 0zM4 6h16v1H4V6zm14 15H6a3 3 0 0 1-3-3V8a1 1 0 0 1 1-1h16a1 1 0 0 1 1 1v10a3 3 0 0 1-3 3z" />
  </svg>
);

const CopyIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M16 1H4a2 2 0 0 0-2 2v14h2V3h12V1zm3 4H8a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h11a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2zm0 16H8V7h11v14z" />
  </svg>
);

const CheckIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z" />
  </svg>
);

type AppMode = 'generator' | 'osBuilder' | 'unblocker' | 'chat' | 'settings';
type OsApp = 'App Store' | 'Camera' | 'Calculator' | 'Browser' | 'Maps' | 'Music' | 'Shortcuts' | 'System Settings' | 'Chat' | 'File Explorer' | 'Task Manager' | 'Terminal' | 'About Dem';
type OsHardware = 'Notch' | 'Dynamic Island';
type OsWallpaper = 'Sonoma' | 'Ventura' | 'Monterey' | 'Big Sur' | 'Dem Abstract';
type ChatClient = 'cinny' | 'discord';

const examplePrompts = [
  "Create a simple snake game with a score counter.",
  "Build a modern portfolio website with a contact form.",
  "Design a weather app UI that shows the current temperature and a 5-day forecast.",
  "Make a simple todo list app where I can add and remove items."
];

const osLoadingMessages = [
    "Booting Dem OS kernel...",
    "Calibrating dynamic island...",
    "Loading window manager...",
    "Polishing frosted glass...",
    "Initializing application suite...",
    "Reticulating splines...",
    "Applying desktop wallpaper...",
    "Finalizing UI...",
];

const App: React.FC = () => {
  const [appMode, setAppMode] = useState<AppMode>('generator');
  const [prompt, setPrompt] = useState<string>('');
  const [unblockerUrl, setUnblockerUrl] = useState<string>('');
  const [generatedCode, setGeneratedCode] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [copySuccess, setCopySuccess] = useState<boolean>(false);
  const [viewMode, setViewMode] = useState<'code' | 'preview'>('code');
  const [isOsModeActive, setIsOsModeActive] = useState<boolean>(false);
  const [loadingMessage, setLoadingMessage] = useState<string | null>(null);
  const loadingIntervalRef = useRef<number | null>(null);
  const hasBootedRef = useRef<boolean>(false);

  // State for Dem OS Builder
  const [osApps, setOsApps] = useState<Set<OsApp>>(new Set(['Browser', 'Calculator', 'Camera', 'System Settings', 'Chat', 'File Explorer', 'Task Manager', 'Terminal', 'About Dem']));
  const [osHardware, setOsHardware] = useState<OsHardware>('Dynamic Island');
  const [osWallpaper, setOsWallpaper] = useState<OsWallpaper>('Dem Abstract');
  const [osDevMode, setOsDevMode] = useState<boolean>(false);
  const [osSiri, setOsSiri] = useState<boolean>(true);
  
  // State for Chat
  const [chatClient, setChatClient] = useState<ChatClient | null>(null);
  
  // State for Settings
  const [settings, setSettings] = useState({
      animationsEnabled: true,
      aiModel: 'gemini-2.5-flash',
  });

  useEffect(() => {
    if (appMode !== 'chat') {
        setChatClient(null);
    }
  }, [appMode]);
  
  // Listener for exiting Dem OS mode
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data === 'exitDemOS') {
        setIsOsModeActive(false);
      }
    };
    window.addEventListener('message', handleMessage);
    return () => {
      window.removeEventListener('message', handleMessage);
    };
  }, []);

  const toggleOsApp = (app: OsApp) => {
    // System Settings is mandatory for exiting OS mode, prevent unchecking
    if (app === 'System Settings') return;
    setOsApps(prev => {
      const newApps = new Set(prev);
      if (newApps.has(app)) {
        newApps.delete(app);
      } else {
        newApps.add(app);
      }
      return newApps;
    });
  };

  const generateOsPrompt = useCallback(() => {
    const appList = Array.from(osApps).join(', ');
    const wallpaperUrlMap: Record<OsWallpaper, string> = {
        'Sonoma': 'https://4kwallpapers.com/images/wallpapers/macos-sonoma-2880x1800-12133.jpg',
        'Ventura': 'https://4kwallpapers.com/images/wallpapers/macos-ventura-2880x1800-12127.jpg',
        'Monterey': 'https://4kwallpapers.com/images/wallpapers/macos-monterey-2880x1800-12124.jpg',
        'Big Sur': 'https://4kwallpapers.com/images/wallpapers/macos-big-sur-2880x1800-12121.jpg',
        'Dem Abstract': 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=2864&auto=format&fit=crop'
    };

    return `Generate a single-file HTML simulation of a macOS-like desktop OS called 'Dem OS'. It must be self-contained (all CSS/JS inline) and avoid any warnings about being a simulation.

**Overall Design:**
- **Aesthetics:** Clean, modern, macOS-inspired. Use frosted glass effects (\`backdrop-filter: blur\`) on the menu bar, dock, and windows.
- **Logo:** The "DS" logo must be in the top-left of the menu bar.
- **Hardware:** Simulate a '${osHardware}'. If 'Dynamic Island', make it interactive with apps like Music.
- **Wallpaper:** Use this URL for the desktop background: ${wallpaperUrlMap[osWallpaper]}

**Core UI Elements:**
1.  **Top Menu Bar:** Fixed, frosted glass.
    - Left: "DS" logo, then non-functional "File", "Edit", "View" menus.
    - Right: Icons for Control Center, ${osSiri ? 'Siri,' : ''} Bluetooth, Wi-Fi. It MUST also include a **live battery indicator** (using \`navigator.getBattery()\`) and a **live clock** (HH:MM:SS).
2.  **Bottom Dock:** macOS-style with app launch animations. Include icons for all selected apps: ${appList}.
3.  **Advanced Window Manager:**
    - **Appearance:** Each app must open in a separate window with rounded corners, a subtle box-shadow for depth, and a frosted glass effect (\`background-color: rgba(255, 255, 255, 0.5); backdrop-filter: blur(15px);\`).
    - **Traffic Lights:** The top-left corner must have three distinct circular buttons: red (close), yellow (minimize to dock - can be simulated), and green (maximize/restore).
    - **Draggability:** Windows must be draggable by their title bar. Implement this with JavaScript mouse events (\`mousedown\`, \`mousemove\`, \`mouseup\`).
    - **Resizability:** Windows must be resizable from their edges and corners. A small resize handle in the bottom-right corner is an acceptable alternative.
    - **Active State (Z-Index Management):** This is critical. Implement a robust z-index management system. When a window is clicked, it must visually come to the front of all other windows. The active window should have a slightly stronger box-shadow. The JavaScript should track the highest current z-index and assign a higher value to the newly focused window.

**Required Apps & Functionality:**
- **Mandatory Live Features:**
    - **Camera App:** Must use \`navigator.mediaDevices.getUserMedia()\` for a live webcam feed.
    - **Live Battery:** The menu bar icon must show the real device's battery status.
- **Included Apps:**
    - **Browser:** Functional, with an iframe for websites (default: google.com).
    - **Calculator:** A working standard calculator.
    - **Chat:** A functional chat client named 'Dem Chat'. When opened, it MUST display a window containing a full-size iframe with \`src='https://app.cinny.in'\`.
    - **File Explorer:** A functional file manager.
        - **Simulated File System:** It must manage a simulated file system represented by a JavaScript object. This *same object* must be accessible by both the File Explorer and the Terminal. Initialize it with this structure: \`{ "Documents": { "Project Plan.txt": "Content of project plan.", "Meeting Notes.md": "# Meeting Notes\\n- Discuss Q3 goals." }, "Pictures": { "Vacation.jpg": "placeholder" }, "Music": {}, "README.txt": "Welcome to Dem OS!" }\`.
        - **UI:** Must have a two-pane layout. A sidebar for quick access to 'Documents', 'Pictures', 'Music' and a main pane displaying folder contents. Use appropriate icons for folders and files.
        - **Navigation:** Clicking folders must update the view to show their contents. Implement breadcrumbs or a back button to navigate up the directory tree.
        - **File Viewing:** Double-clicking a \`.txt\` or \`.md\` file should open a simple text viewer modal showing its content from the JS object.
        - **Drag and Drop Functionality (CRITICAL):**
            - Files must be draggable using the HTML Drag and Drop API (\`draggable="true"\`, \`dragstart\`, \`dragover\`, \`drop\` events).
            - When a file is dropped onto a folder icon, the underlying JavaScript file system object must be updated. The UI must re-render immediately.
    - **Terminal:** A functional command-line interface.
        - **UI:** Classic terminal look with a black background, monospaced font, and a **blinking cursor**. The prompt should show the current directory, e.g., \`DemBook:~/Documents $\`.
        - **File System Interaction:** It must interact with the *exact same* file system JavaScript object used by the File Explorer. It needs its own internal state to track the current working directory (CWD), starting at the root ('~').
        - **Command Handling:** On pressing Enter, it should process the command, append output, and show a new input line. Implement the following commands:
            - \`help\`: List available commands (\`ls\`, \`cd\`, \`echo\`, \`clear\`, \`help\`).
            - \`echo [text]\`: Print \`[text]\` to the terminal.
            - \`ls\`: List files and folders in the CWD from the file system object. Folders should be styled differently (e.g., color).
            - \`cd [directory]\`: Change the CWD. Must handle \`cd ..\` (parent), \`cd ~\` (home/root), and changing into subdirectories. Show an error for non-existent directories. The prompt must update to the new CWD.
            - \`clear\`: Clear all previous output from the terminal view.
    - **Task Manager:** A functional process manager.
        - **Simulated Processes:** Manage a list of running processes in a JavaScript array. Initialize it with processes corresponding to the included apps, plus system processes like 'kernel_task', 'WindowServer', and 'Dock'.
        - **Live CPU Simulation (CRITICAL):** The CPU usage percentage for each process must appear live. It must be updated with a new, random, and plausible value (e.g., 0.1% to 15% for background tasks) every 2-3 seconds using \`setInterval\`. This is essential for a dynamic and realistic feel.
        - **UI:** Display processes in a table with sortable columns for PID, Name, and CPU.
        - **End Task Functionality:** Include an 'End Task' button. When a process is selected and clicked, remove it from the JS array and update the UI. Protect essential processes like 'kernel_task' from being ended.
    - **About Dem:** This app must open a window showing system specifications.
        - **UI:** Create a two-column layout. On the left, display the specs. On the right, display an image of the chip.
        - **Specs:** List the following: DemBook Pro (16-inch, 2025), Chip: Dem Chip D4 Pro Max, Memory: 32 GB RAM, a randomly generated serial number, and today's date.
        - **Chip Image (CRITICAL):** It must prominently feature an image of the "Dem Chip D4 Pro Max". Use this specific URL for the image: 'https://images.unsplash.com/photo-1591795435461-4a82110a7f43?q=80&w=1200&auto=format&fit=crop'. Style the image with a subtle glowing effect (e.g., using \`box-shadow\` or \`filter: drop-shadow\`).
    - **Control Center:** Panel with working sliders for simulated brightness (\`filter: brightness()\`) and sound.
    - **Maps:** Embedded interactive map.
    - **Music:** Simple player. Must interact with Dynamic Island if active.
    - **Shortcuts:** A visual mock-up is sufficient.
    ${osSiri ? "- **Siri:** Clicking its icon should show a pulsating orb animation." : ""}
    ${osDevMode ? "- **Developer Mode:** Include a simulated terminal or code editor app. Since Terminal is selected, prioritize its full functionality." : ""}

**System Behavior & Host Integration:**
- **CRITICAL EXIT MECHANISM:** The 'System Settings' app is mandatory. It MUST contain a clearly visible button labeled 'Exit Dem OS'. When this button is clicked, it must execute this exact JavaScript: \`window.parent.postMessage('exitDemOS', '*')\`.
- **Shutdown:** A "Shut Down" option in the "DS" menu should show a confirmation dialog, then fade the simulation to black.
- **Omissions:** Do not implement Phone Mirroring, CarPlay, or a Touch Bar.`;
  }, [osApps, osHardware, osWallpaper, osDevMode, osSiri]);
  
  const handleSwitchToOs = async () => {
    if (isLoading) return;

    setIsLoading(true);
    setError(null);
    setGeneratedCode('');
    
    // Start loading messages
    let messageIndex = 0;
    setLoadingMessage(osLoadingMessages[messageIndex]);
    loadingIntervalRef.current = window.setInterval(() => {
        messageIndex++;
        if (messageIndex < osLoadingMessages.length) {
            setLoadingMessage(osLoadingMessages[messageIndex]);
        } else {
            setLoadingMessage("Just a few more seconds...");
            if (loadingIntervalRef.current) clearInterval(loadingIntervalRef.current);
        }
    }, 250);

    try {
      const osPrompt = generateOsPrompt();
      const code = await generateCode(osPrompt, false);
       if (code.startsWith('Error:')) {
        setError(code);
      } else {
        setGeneratedCode(code);
        setIsOsModeActive(true);
      }
    } catch (e: unknown) {
      const errorMessage = e instanceof Error ? e.message : "An unexpected error occurred.";
      setError(errorMessage);
    } finally {
        setIsLoading(false);
        if (loadingIntervalRef.current) clearInterval(loadingIntervalRef.current);
        setLoadingMessage(null);
    }
  };
  
  // Boot into Dem OS on initial load
  useEffect(() => {
    if (!hasBootedRef.current) {
        hasBootedRef.current = true;
        handleSwitchToOs();
    }
  }, []); // Empty dependency array ensures this runs only once on mount

  const handleGenerate = useCallback(async () => {
    let finalPrompt: string;
    let useSearch = false;
    const isOsBuild = appMode === 'osBuilder';

    if (isOsBuild) {
      finalPrompt = generateOsPrompt();
    } else if (appMode === 'unblocker') {
        if (!unblockerUrl) return;
        finalPrompt = `You are a web proxy. Your task is to fetch the full HTML content of the following URL: ${unblockerUrl}. Rewrite the fetched HTML to be self-contained and renderable in an iframe. This means all relative URLs for assets (CSS, JS, images, links) must be converted to absolute URLs. You must remove any frame-busting scripts or headers (like X-Frame-Options). Return only the modified, complete HTML code.`;
        useSearch = true;
    } else {
      finalPrompt = prompt;
    }

    if (!finalPrompt || isLoading) return;

    setIsLoading(true);
    setError(null);
    setGeneratedCode('');
    setViewMode('code');

    if (isOsBuild) {
        let messageIndex = 0;
        setLoadingMessage(osLoadingMessages[messageIndex]);
        loadingIntervalRef.current = window.setInterval(() => {
            messageIndex++;
            if (messageIndex < osLoadingMessages.length) {
                setLoadingMessage(osLoadingMessages[messageIndex]);
            } else {
                setLoadingMessage("Just a few more seconds...");
                if (loadingIntervalRef.current) clearInterval(loadingIntervalRef.current);
            }
        }, 250);
    }

    try {
      const code = await generateCode(finalPrompt, useSearch);
      if (code.startsWith('Error:')) {
        setError(code);
      } else {
        setGeneratedCode(code);
        if (appMode === 'unblocker' || appMode === 'osBuilder') {
            setViewMode('preview');
        }
      }
    } catch (e: unknown) {
      const errorMessage = e instanceof Error ? e.message : "An unexpected error occurred.";
      setError(errorMessage);
    } finally {
      setIsLoading(false);
      if (loadingIntervalRef.current) clearInterval(loadingIntervalRef.current);
      setLoadingMessage(null);
    }
  }, [prompt, isLoading, appMode, generateOsPrompt, unblockerUrl]);

  const handleCopy = () => {
    if (!generatedCode) return;
    navigator.clipboard.writeText(generatedCode).then(() => {
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    });
  };

  const handleLoadDiscord = useCallback(async () => {
    const discordUrl = 'https://discord.com/app';
    const finalPrompt = `You are a web proxy. Your task is to fetch the full HTML content of the following URL: ${discordUrl}. Rewrite the fetched HTML to be self-contained and renderable in an iframe. This means all relative URLs for assets (CSS, JS, images, links) must be converted to absolute URLs. You must remove any frame-busting scripts or headers (like X-Frame-Options). Return only the modified, complete HTML code.`;
    
    setIsLoading(true);
    setError(null);
    setGeneratedCode('');
    setViewMode('preview');

    try {
      const code = await generateCode(finalPrompt, true);
      if (code.startsWith('Error:')) {
        setError(code);
      } else {
        setGeneratedCode(code);
        setChatClient('discord');
      }
    } catch (e: unknown) {
      const errorMessage = e instanceof Error ? e.message : "An unexpected error occurred.";
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, []);
  
  const isGenerateDisabled = isLoading || (appMode === 'generator' && !prompt) || (appMode === 'unblocker' && !unblockerUrl);

  const getButtonText = () => {
    if (isLoading) return 'Generating...';
    switch (appMode) {
      case 'osBuilder': return 'Generate Dem OS';
      case 'unblocker': return 'Load Page';
      default: return 'Generate Code';
    }
  };

  const renderChatContent = () => {
    if (chatClient === 'cinny') {
      return (
        <iframe
          src="https://app.cinny.in"
          title="Dem Chat"
          className="w-full h-full min-h-[600px] bg-white border-0 rounded-b-md sm:rounded-md"
        />
      );
    }
    
    return (
        <div className="text-center p-8">
            <h2 className="text-2xl font-semibold text-cyan-400 mb-4">Choose a Chat Client</h2>
            <p className="text-slate-400 mb-8">Select which chat experience you'd like to use.</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <button onClick={() => setChatClient('cinny')} className="p-6 bg-slate-700 hover:bg-slate-600 rounded-lg transition-all transform hover:scale-105 disabled:opacity-50" disabled={isLoading}>
                    <h3 className="text-xl font-bold text-slate-100">Dem Chat</h3>
                    <p className="text-slate-400 mt-2">Decentralized chat on the Matrix network. Public and open.</p>
                </button>
                <button onClick={handleLoadDiscord} className="p-6 bg-slate-700 hover:bg-slate-600 rounded-lg transition-all transform hover:scale-105 disabled:opacity-50" disabled={isLoading}>
                    <h3 className="text-xl font-bold text-slate-100">Discord</h3>
                    <p className="text-slate-400 mt-2">Load the Discord web client in the previewer.</p>
                </button>
            </div>
        </div>
    );
  };
  
  const TabButton: React.FC<{mode: AppMode, label: string}> = ({ mode, label }) => (
    <button onClick={() => setAppMode(mode)} className={`px-4 py-3 text-lg font-semibold transition-colors flex-grow text-center ${appMode === mode ? 'text-cyan-400 border-b-2 border-cyan-400' : 'text-slate-400 hover:text-slate-200'}`}>{label}</button>
  );

  if (isOsModeActive) {
    return (
      <iframe
        srcDoc={generatedCode}
        title="Dem OS"
        className="w-screen h-screen border-0 absolute top-0 left-0"
        sandbox="allow-scripts allow-modals allow-forms allow-same-origin"
        allow="camera; microphone; battery; geolocation; fullscreen"
      />
    );
  }

  // Show loading screen while OS is booting for the first time
  if (isLoading && hasBootedRef.current && !isOsModeActive) {
    return (
        <div className="min-h-screen bg-slate-900 text-slate-200 flex flex-col items-center justify-center text-center p-4">
            <svg className="animate-spin mb-4 h-12 w-12 text-cyan-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
            <p className="text-xl text-slate-300 font-semibold">{loadingMessage || "Booting Dem OS..."}</p>
            <p className="text-md text-slate-500 mt-1">Please wait, the experience is loading.</p>
        </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 text-slate-200 font-sans p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        <header className="flex items-center justify-center space-x-3 mb-8">
          <RobotIcon className="w-10 h-10 text-cyan-400" />
          <h1 className="text-4xl font-bold text-slate-100 tracking-tight">Dem Bot</h1>
        </header>

        <main className="space-y-8">
          <div className="bg-slate-800/50 rounded-lg p-6 shadow-lg border border-slate-700">
            <div className="flex flex-wrap border-b border-slate-700 mb-6">
              <TabButton mode="generator" label="Generator" />
              <TabButton mode="osBuilder" label="Dem OS" />
              <TabButton mode="unblocker" label="Unblocker" />
              <TabButton mode="chat" label="Chat" />
              <TabButton mode="settings" label="Settings" />
            </div>
            
            {appMode === 'generator' && (
              <div>
                <h2 className="text-xl font-semibold mb-4 text-cyan-400">What do you want to build?</h2>
                <textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="e.g., A retro-style landing page for a coffee shop..."
                  className="w-full h-32 p-3 bg-slate-900 border border-slate-600 rounded-md focus:ring-2 focus:ring-cyan-500 focus:outline-none transition resize-y text-slate-200 placeholder-slate-500"
                  disabled={isLoading}
                />
                <div className="mt-4 flex flex-wrap gap-2">
                  <span className="text-sm text-slate-400 self-center mr-2">Try an example:</span>
                  {examplePrompts.map((p, i) => (
                    <button key={i} onClick={() => setPrompt(p)} className="px-3 py-1 text-sm bg-slate-700 hover:bg-slate-600 rounded-full transition-colors disabled:opacity-50" disabled={isLoading}>
                      {p.split(' ')[2]}...
                    </button>
                  ))}
                </div>
              </div>
            )}

            {appMode === 'osBuilder' && (
              <div className="space-y-8">
                <h2 className="text-2xl font-semibold text-cyan-400 text-center">Dem OS Customizer</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {/* Hardware Column */}
                    <div className="space-y-4 p-4 bg-slate-900/50 rounded-lg">
                        <h3 className="text-lg font-medium text-slate-300 border-b border-slate-700 pb-2">Hardware</h3>
                         <div>
                            <label className="block text-sm font-medium text-slate-400 mb-2">Display Type</label>
                            <div className="flex gap-2">
                                {(['Notch', 'Dynamic Island'] as OsHardware[]).map(h => <button key={h} onClick={() => setOsHardware(h)} className={`w-full px-4 py-2 rounded-md transition-colors text-sm ${osHardware === h ? 'bg-cyan-600 text-white' : 'bg-slate-700 hover:bg-slate-600'}`}>{h}</button>)}
                            </div>
                        </div>
                         <div>
                            <label className="block text-sm font-medium text-slate-400 mb-2">System Features</label>
                            <div className="space-y-2">
                               <label className="flex items-center justify-between cursor-pointer p-2 bg-slate-800 rounded-md"><span>Enable Siri</span><input type="checkbox" className="toggle toggle-cyan" checked={osSiri} onChange={() => setOsSiri(!osSiri)} /></label>
                               <label className="flex items-center justify-between cursor-pointer p-2 bg-slate-800 rounded-md"><span>Developer Mode</span><input type="checkbox" className="toggle toggle-cyan" checked={osDevMode} onChange={() => setOsDevMode(!osDevMode)} /></label>
                            </div>
                        </div>
                    </div>
                    {/* Apps Column */}
                    <div className="space-y-4 p-4 bg-slate-900/50 rounded-lg">
                        <h3 className="text-lg font-medium text-slate-300 border-b border-slate-700 pb-2">Include Apps</h3>
                        <div className="grid grid-cols-2 gap-2">
                            {(['App Store', 'Camera', 'Calculator', 'Browser', 'Maps', 'Music', 'Shortcuts', 'System Settings', 'Chat', 'File Explorer', 'Task Manager', 'Terminal', 'About Dem'] as OsApp[]).map(a => <button key={a} onClick={() => toggleOsApp(a)} className={`px-3 py-2 text-sm rounded-md transition-colors flex items-center justify-center gap-2 ${osApps.has(a) ? 'bg-cyan-600 text-white' : 'bg-slate-700 hover:bg-slate-600'} ${a === 'System Settings' ? 'opacity-70 cursor-not-allowed' : ''}`}>{a}</button>)}
                        </div>
                    </div>
                     {/* Personalization Column */}
                    <div className="space-y-4 p-4 bg-slate-900/50 rounded-lg">
                        <h3 className="text-lg font-medium text-slate-300 border-b border-slate-700 pb-2">Personalization</h3>
                        <div>
                            <label className="block text-sm font-medium text-slate-400 mb-2">Wallpaper</label>
                            <div className="grid grid-cols-2 gap-2">
                                {(['Sonoma', 'Ventura', 'Monterey', 'Big Sur', 'Dem Abstract'] as OsWallpaper[]).map(w => <button key={w} onClick={() => setOsWallpaper(w)} className={`px-3 py-2 rounded-md transition-colors text-sm ${osWallpaper === w ? 'bg-cyan-600 text-white ring-2 ring-cyan-400' : 'bg-slate-700 hover:bg-slate-600'}`}>{w}</button>)}
                            </div>
                        </div>
                    </div>
                </div>
              </div>
            )}
            
            {appMode === 'unblocker' && (
                <div>
                    <h2 className="text-xl font-semibold mb-4 text-cyan-400">Enter a URL to visit</h2>
                    <div className="flex gap-2">
                         <input
                            type="url"
                            value={unblockerUrl}
                            onChange={(e) => setUnblockerUrl(e.target.value)}
                            placeholder="https://example.com"
                            className="w-full p-3 bg-slate-900 border border-slate-600 rounded-md focus:ring-2 focus:ring-cyan-500 focus:outline-none transition text-slate-200 placeholder-slate-500"
                            disabled={isLoading}
                        />
                    </div>
                </div>
            )}
            
            {appMode === 'chat' && <div />}
            {appMode === 'settings' && (
                <div className="space-y-6">
                    <h2 className="text-xl font-semibold text-cyan-400">Application Settings</h2>
                    <div className="p-4 bg-slate-900/50 rounded-lg border border-slate-700">
                        <h3 className="text-lg font-medium text-slate-300 mb-3">Dem OS Mode</h3>
                        <p className="text-slate-400 mb-4 text-sm">Switch to a full-screen, immersive Dem OS experience. You can return via the settings inside the OS.</p>
                        <button 
                            onClick={handleSwitchToOs}
                            disabled={isLoading}
                            className="w-full flex items-center justify-center bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-600 disabled:cursor-not-allowed text-white font-bold py-3 px-4 rounded-lg transition-colors"
                        >
                            {isLoading ? 'Preparing OS...' : 'Relaunch Dem OS'}
                        </button>
                    </div>
                    <div className="p-4 bg-slate-900/50 rounded-lg border border-slate-700">
                        <label className="flex items-center justify-between cursor-pointer">
                            <span className="text-lg font-medium text-slate-300">Enable UI Animations</span>
                            <div className="relative"><input type="checkbox" className="sr-only peer" checked={settings.animationsEnabled} onChange={() => setSettings(s => ({...s, animationsEnabled: !s.animationsEnabled}))} /><div className="w-11 h-6 bg-slate-600 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-cyan-600"></div></div>
                        </label>
                    </div>
                    <div className="p-4 bg-slate-900/50 rounded-lg border border-slate-700">
                        <label htmlFor="ai-model-select" className="block text-lg font-medium text-slate-300 mb-2">AI Model Preference</label>
                        <select id="ai-model-select" value={settings.aiModel} onChange={(e) => setSettings(s => ({...s, aiModel: e.target.value}))} className="w-full p-2 bg-slate-800 border border-slate-600 rounded-md focus:ring-2 focus:ring-cyan-500 focus:outline-none">
                            <option value="gemini-2.5-flash">Gemini 2.5 Flash (Recommended)</option>
                        </select>
                    </div>
                     <div className="p-4 bg-slate-900/50 rounded-lg border border-slate-700">
                        <h3 className="text-lg font-medium text-slate-300 mb-2">Manage Data</h3>
                        <button className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-semibold rounded-md transition-colors">Clear Local Cache</button>
                    </div>
                </div>
            )}

            {(appMode === 'generator' || appMode === 'osBuilder' || appMode === 'unblocker') && (
              <button
                onClick={handleGenerate}
                disabled={isGenerateDisabled}
                className="mt-6 w-full flex items-center justify-center bg-cyan-600 hover:bg-cyan-700 disabled:bg-slate-600 disabled:cursor-not-allowed text-white font-bold py-3 px-4 rounded-lg transition-all duration-200 transform hover:scale-105 disabled:scale-100"
              >
                {isLoading && (<svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>)}
                {getButtonText()}
              </button>
            )}
          </div>

          <div className="bg-slate-800/50 rounded-lg shadow-lg border border-slate-700 min-h-[600px] flex flex-col">
             <div className="flex justify-between items-center p-4 border-b border-slate-700">
                <div className="flex items-center space-x-2">
                    <h2 className="text-xl font-semibold text-cyan-400">
                        {appMode === 'chat' && !generatedCode ? 'Chat' : 'Generated Output'}
                    </h2>
                    {appMode !== 'chat' && generatedCode && (
                        <div className="flex items-center bg-slate-900 rounded-md p-1">
                            <button onClick={() => setViewMode('code')} className={`px-3 py-1 text-sm rounded-md transition-colors ${viewMode === 'code' ? 'bg-cyan-600 text-white' : 'hover:bg-slate-700'}`}>Code</button>
                            <button onClick={() => setViewMode('preview')} className={`px-3 py-1 text-sm rounded-md transition-colors ${viewMode === 'preview' ? 'bg-cyan-600 text-white' : 'hover:bg-slate-700'}`}>Preview</button>
                        </div>
                    )}
                </div>
              {generatedCode && viewMode === 'code' && (
                <button onClick={handleCopy} className="flex items-center space-x-2 px-3 py-1.5 text-sm bg-slate-700 hover:bg-slate-600 rounded-md transition-colors">
                  {copySuccess ? <CheckIcon className="w-4 h-4 text-green-400" /> : <CopyIcon className="w-4 h-4" />}
                  <span>{copySuccess ? 'Copied!' : 'Copy'}</span>
                </button>
              )}
               {appMode === 'chat' && (chatClient || generatedCode) && !isLoading &&(
                <button onClick={() => { setChatClient(null); setGeneratedCode(''); setError(null); }} className="px-3 py-1.5 text-sm bg-slate-700 hover:bg-slate-600 rounded-md transition-colors">Back</button>
               )}
            </div>

            <div className="flex-grow relative">
              {appMode === 'chat' && !generatedCode && !isLoading && !error ? (
                <div className="w-full h-full min-h-[600px]">{renderChatContent()}</div>
              ) : (
                <div className="p-0 sm:p-4 h-full">
                  {isLoading && (
                     <div className="flex flex-col items-center justify-center text-center h-full min-h-[400px]">
                        {loadingMessage ? (
                            <>
                                <svg className="animate-spin mb-4 h-8 w-8 text-cyan-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                                <p className="text-lg text-slate-300 font-semibold">{loadingMessage}</p>
                                <p className="text-sm text-slate-500 mt-1">This can take a moment, please be patient.</p>
                            </>
                        ) : (
                            <div className="w-full max-w-lg p-4 space-y-4 animate-pulse">
                                <div className="h-4 bg-slate-700 rounded w-3/4"></div><div className="h-4 bg-slate-700 rounded w-1/2"></div><div className="h-4 bg-slate-700 rounded w-5/6"></div><div className="h-4 bg-slate-700 rounded w-1/4"></div><div className="h-4 bg-slate-700 rounded w-full"></div>
                            </div>
                        )}
                    </div>
                  )}
                  {error && (
                    <div className="m-4 text-red-400 bg-red-900/50 p-4 rounded-md"><p className="font-semibold">Generation Failed</p><p>{error}</p></div>
                  )}
                  {!isLoading && !generatedCode && !error && (
                    <div className="text-center text-slate-500 flex flex-col items-center justify-center h-full min-h-[400px]">
                      <p className="text-lg">Your generated code will appear here.</p>
                      <p>Enter a prompt or use the Dem OS Builder to get started.</p>
                    </div>
                  )}
                  {generatedCode && (
                    viewMode === 'code' ? (
                      <pre className="w-full h-[600px] overflow-auto whitespace-pre-wrap bg-slate-950/70 p-4 rounded-md">
                        <code className="text-sm font-mono text-slate-300">{generatedCode}</code>
                      </pre>
                    ) : (
                      <iframe
                        srcDoc={generatedCode}
                        title="Generated Preview"
                        className="w-full h-[600px] bg-white border-0 rounded-md"
                        sandbox="allow-scripts allow-modals allow-forms allow-same-origin"
                        allow="camera; microphone; battery; geolocation; fullscreen"
                      />
                    )
                  )}
                </div>
              )}
            </div>
          </div>
        </main>
        <footer className="text-center mt-12 text-slate-500 text-sm space-y-1">
          <p>&copy; {new Date().getFullYear()} Dem studios. All Rights Reserved.</p>
        </footer>
      </div>
    </div>
  );
};

export default App;