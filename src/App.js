import React, { useState, useEffect, createContext, useContext, useRef } from 'react'; // Import useRef
import { initializeApp } from 'firebase/app';
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  sendSignInLinkToEmail, // Import sendSignInLinkToEmail
  isSignInWithEmailLink, // Import isSignInWithEmailLink
  signInWithEmailLink, // Import signInWithEmailLink
  sendPasswordResetEmail, // Import sendPasswordResetEmail
} from 'firebase/auth';
import {
  getFirestore,
  collection,
  addDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  doc,
  query,
  where,
  orderBy,
  serverTimestamp,
  Timestamp
} from 'firebase/firestore';

// Import Lucide Icons
import { Plus, Edit, Trash2, Save, Check, X, DollarSign, Clock, Target, Feather, Briefcase, CalendarDays, ListTodo, BarChart2, LogOut, Settings, Mail, Lock, Lightbulb, ChevronDown, ChevronUp, Menu, X as CloseIcon, Moon, Sun, Monitor } from 'lucide-react'; // Added Menu, CloseIcon, Moon, Sun, Monitor


// Import React Markdown for rendering suggestions
// You need to install this library: npm install react-markdown or yarn add react-markdown
import ReactMarkdown from 'react-markdown';


const firebaseConfig = {
  apiKey: "AIzaSyAi1bx2_HJ8nLDvd2F6wtFdqf1i-0clfe4",
  authDomain: "mentoro-16b0f.firebaseapp.com",
  projectId: "mentoro-16b0f",
  storageBucket: "mentoro-16b0f.firebasestorage.app",
  messagingSenderId: "683339820589",
  appId: "1:683339820589:web:44fce3970fac92c411192a4",
  measurementId: "G-XF2K333FL7"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

const AuthContext = createContext();

const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const signup = (email, password) => {
    return createUserWithEmailAndPassword(auth, email, password);
  };

  const login = (email, password) => {
    return signInWithEmailAndPassword(auth, email, password);
  };

  const logout = () => {
    return signOut(auth);
  };

  const value = {
    currentUser,
    signup,
    login,
    logout,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

const ProtectedRoute = ({ children }) => {
  const { currentUser } = useAuth();
  if (!currentUser) {
    return <Auth />;
  }
  return children;
};

const Auth = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordlessEmail, setPasswordlessEmail] = useState(''); // State for passwordless email
  const [forgotPasswordEmail, setForgotPasswordEmail] = useState(''); // State for forgot password email
  const [error, setError] = useState('');
  const [infoMessage, setInfoMessage] = useState(''); // State for info messages
  const [emailLinkSent, setEmailLinkSent] = useState(false); // State to track if email link is sent
  const [showPasswordless, setShowPasswordless] = useState(false); // State to toggle passwordless section visibility
  const [showForgotPassword, setShowForgotPassword] = useState(false); // State to toggle forgot password section visibility


  const { signup, login } = useAuth();

  // Action code settings for email link
  const actionCodeSettings = {
    url: window.location.href, // The URL to redirect to after sign-in.
    handleCodeInApp: true, // This must be true.
  };

  // Handle email/password submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setInfoMessage('');
    try {
      if (isLogin) {
        await login(email, password);
      } else {
        await signup(email, password);
      }
    } catch (err) {
      setError(err.message);
    }
  };

  // Handle sending passwordless email link
  const handleSendEmailLink = async () => {
    if (passwordlessEmail.trim() === '') {
      setError('Please enter your email address.');
      return;
    }
    setError('');
    setInfoMessage('');
    try {
      await sendSignInLinkToEmail(auth, passwordlessEmail, actionCodeSettings);
      setInfoMessage(`Email link sent to ${passwordlessEmail}. Check your inbox!`);
      setEmailLinkSent(true);
      // Save the email locally so we don't need to ask the user for it again
      window.localStorage.setItem('emailForSignIn', passwordlessEmail);
    } catch (err) {
      setError(err.message);
      setEmailLinkSent(false);
    }
  };

   // Handle sending password reset email
   const handleSendPasswordReset = async () => {
       if (forgotPasswordEmail.trim() === '') {
           setError('Please enter your email address.');
           return;
       }
       setError('');
       setInfoMessage('');
       try {
           await sendPasswordResetEmail(auth, forgotPasswordEmail);
           setInfoMessage(`Password reset email sent to ${forgotPasswordEmail}. Check your inbox!`);
           setForgotPasswordEmail(''); // Clear the input after sending
       } catch (err) {
           setError(err.message);
       }
   };


  // Effect to handle sign-in with email link on page load
  useEffect(() => {
    // Check if the current URL is a sign-in with email link
    if (isSignInWithEmailLink(auth, window.location.href)) {
      // Get the email from localStorage (saved when the link was sent)
      let email = window.localStorage.getItem('emailForSignIn');
      if (!email) {
        // If email is not in localStorage, prompt the user for it
        email = window.prompt('Please provide your email for confirmation.');
      }
      if (email) {
        setInfoMessage('Signing in with email link...');
        signInWithEmailLink(auth, email, window.location.href)
          .then((result) => {
            // Clear email from localStorage
            window.localStorage.removeItem('emailForSignIn');
            setInfoMessage('Successfully signed in!');
            setError('');
            // You might want to redirect the user after successful login
            // window.location.assign(actionCodeSettings.url); // Or use React Router history
          })
          .catch((err) => {
            setError('Error signing in with email link: ' + err.message);
            setInfoMessage('');
          });
      } else {
         setError('Email is required to complete sign-in.');
         setInfoMessage('');
      }
    }
  }, [auth]); // Run this effect only once on component mount


  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4 sm:p-6 dark:bg-gray-900 transition-colors duration-200"> {/* Lighter background, added padding, dark mode */}
      <div className="bg-white dark:bg-gray-800 p-6 sm:p-8 rounded-2xl shadow-xl w-full max-w-sm border border-gray-200 dark:border-gray-700 transition-colors duration-200"> {/* More rounded corners, larger shadow, slightly wider max-width, dark mode */}
        <h2 className="text-2xl sm:text-3xl font-bold mb-6 sm:mb-8 text-center text-gray-800 dark:text-gray-100">{isLogin ? 'Welcome Back' : 'Join Mentoro'}</h2> {/* Adjusted font size and spacing, dark mode */}
        {error && <p className="text-red-500 text-sm mb-4 text-center">{error}</p>}
        {infoMessage && <p className="text-blue-600 text-sm mb-4 text-center">{infoMessage}</p>}

        {/* Email/Password Section */}
        {!emailLinkSent && !showPasswordless && !showForgotPassword && ( // Hide if email link sent, passwordless shown, or forgot password shown
            <>
                <form onSubmit={handleSubmit}>
                    <div className="mb-4"> {/* Adjusted margin */}
                        <label className="block text-gray-700 dark:text-gray-300 text-sm font-semibold mb-2" htmlFor="email">
                        Email
                        </label>
                        <input
                        className="shadow-sm appearance-none border border-gray-300 dark:border-gray-600 rounded-lg w-full py-2 px-3 text-gray-700 dark:text-gray-200 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200 bg-white dark:bg-gray-700" // Adjusted padding, dark mode
                        id="email"
                        type="email"
                        placeholder="Enter your email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        />
                    </div>
                    {/* Password input is now always shown in this section */}
                    <div className="mb-6">
                        <label className="block text-gray-700 dark:text-gray-300 text-sm font-semibold mb-2" htmlFor="password">
                        Password
                        </label>
                        <input
                        className="shadow-sm appearance-none border border-gray-300 dark:border-gray-600 rounded-lg w-full py-2 px-3 text-gray-700 dark:text-gray-200 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200 bg-white dark:bg-gray-700" // Adjusted padding, dark mode
                        id="password"
                        type="password"
                        placeholder="Enter your password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        />
                    </div>
                    <div className="flex flex-col items-center justify-center gap-3 mb-6"> {/* Adjusted gap */}
                        <button
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 px-4 rounded-lg focus:outline-none focus:shadow-outline transition duration-200 transform hover:scale-105" // Adjusted padding
                        type="submit"
                        >
                        {isLogin ? 'Login with Password' : 'Sign Up with Password'}
                        </button>
                        <button
                        className="inline-block align-baseline font-semibold text-sm text-blue-600 hover:text-blue-800 transition duration-200"
                        type="button"
                        onClick={() => setIsLogin(!isLogin)}
                        >
                        {isLogin ? 'Need an account? Sign Up' : 'Already have an account? Login'}
                        </button>
                    </div>
                </form>

                 {/* Forgot Password Link */}
                <div className="text-center mt-4">
                    <button
                        className="inline-block align-baseline font-semibold text-sm text-gray-600 hover:text-gray-800 transition duration-200 dark:text-gray-400 dark:hover:text-gray-200" // Dark mode
                        type="button"
                        onClick={() => { setShowForgotPassword(true); setError(''); setInfoMessage(''); }} // Show forgot password form
                    >
                        Forgot Password?
                    </button>
                </div>

                {/* Option to show passwordless login */}
                <div className="text-center mt-2"> {/* Adjusted margin */}
                    <button
                        className="inline-block align-baseline font-semibold text-sm text-gray-600 hover:text-gray-800 transition duration-200 dark:text-gray-400 dark:hover:text-gray-200" // Dark mode
                        type="button"
                        onClick={() => { setShowPasswordless(true); setError(''); setInfoMessage(''); }} // Show passwordless form
                    >
                        Prefer passwordless login?
                    </button>
                </div>
            </>
        )}


        {/* Passwordless Sign-in Section */}
         {!emailLinkSent && showPasswordless && !showForgotPassword && ( // Only show passwordless option if email link is not sent and showPasswordless is true, and forgot password is not shown
             <div className="mt-6">
                 <h3 className="text-xl font-semibold mb-4 text-gray-800 dark:text-gray-100 text-center">Login with Email Link</h3> {/* Dark mode */}
                 <div className="mb-4">
                     <label className="block text-gray-700 dark:text-gray-300 text-sm font-semibold mb-2" htmlFor="passwordlessEmail"> {/* Dark mode */}
                         Email (Passwordless Login)
                     </label>
                     <input
                         className="shadow-sm appearance-none border border-gray-300 dark:border-gray-600 rounded-lg w-full py-2 px-3 text-gray-700 dark:text-gray-200 leading-tight focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition duration-200 bg-white dark:bg-gray-700" // Adjusted padding, dark mode
                         id="passwordlessEmail"
                         type="email"
                         placeholder="Enter your email for a login link"
                         value={passwordlessEmail}
                         onChange={(e) => setPasswordlessEmail(e.target.value)}
                     />
                 </div>
                 <button
                     className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-2.5 px-4 rounded-lg focus:outline-none focus:shadow-outline transition duration-200 transform hover:scale-105 flex items-center justify-center" // Adjusted padding
                     onClick={handleSendEmailLink}
                 >
                     <Mail size={20} className="mr-2"/> Send Login Link
                 </button>
                  {/* Option to go back to password login */}
                <div className="text-center mt-4">
                    <button
                        className="inline-block align-baseline font-semibold text-sm text-gray-600 hover:text-gray-800 transition duration-200 dark:text-gray-400 dark:hover:text-gray-200" // Dark mode
                        type="button"
                        onClick={() => { setShowPasswordless(false); setError(''); setInfoMessage(''); }} // Hide passwordless form
                    >
                        Back to password login
                    </button>
                </div>
             </div>
         )}

        {/* Forgot Password Section */}
        {!emailLinkSent && showForgotPassword && !showPasswordless && ( // Only show if email link not sent, forgot password is true, and passwordless is not shown
            <div className="mt-6">
                <h3 className="text-xl font-semibold mb-4 text-gray-800 dark:text-gray-100 text-center">Forgot Password</h3> {/* Dark mode */}
                <div className="mb-4">
                    <label className="block text-gray-700 dark:text-gray-300 text-sm font-semibold mb-2" htmlFor="forgotPasswordEmail"> {/* Dark mode */}
                        Email Address
                    </label>
                    <input
                        className="shadow-sm appearance-none border border-gray-300 dark:border-gray-600 rounded-lg w-full py-2 px-3 text-gray-700 dark:text-gray-200 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200 bg-white dark:bg-gray-700" // Dark mode
                        id="forgotPasswordEmail"
                        type="email"
                        placeholder="Enter your email"
                        value={forgotPasswordEmail}
                        onChange={(e) => setForgotPasswordEmail(e.target.value)}
                        required
                    />
                </div>
                <button
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 px-4 rounded-lg focus:outline-none focus:shadow-outline transition duration-200 transform hover:scale-105 flex items-center justify-center"
                    onClick={handleSendPasswordReset}
                >
                    <Lock size={20} className="mr-2"/> Send Reset Link
                </button>
                 {/* Option to go back to login */}
                <div className="text-center mt-4">
                    <button
                        className="inline-block align-baseline font-semibold text-sm text-gray-600 hover:text-gray-800 transition duration-200 dark:text-gray-400 dark:hover:text-gray-200" // Dark mode
                        type="button"
                        onClick={() => { setShowForgotPassword(false); setError(''); setInfoMessage(''); }} // Hide forgot password form
                    >
                        Back to login
                    </button>
                </div>
            </div>
        )}


         {/* Show message when email link is sent */}
         {emailLinkSent && (
             <div className="mt-6 text-center text-blue-600 text-lg">
                 Email link sent! Check your inbox to complete login.
             </div>
         )}


      </div>
    </div>
  );
};

const Roadmap = () => {
  const { currentUser } = useAuth();
  const [roadmapItems, setRoadmapItems] = useState([]);
  const [newItem, setNewItem] = useState('');
  const [editingItem, setEditingItem] = useState(null);
  const [editText, setEditText] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false); // State to toggle suggestions visibility
  const [suggestionsText, setSuggestionsText] = useState(''); // State to hold suggestions


  useEffect(() => {
    const fetchRoadmap = async () => {
      if (!currentUser) {
          console.log("Roadmap: No user logged in, skipping fetch.");
          return;
      }
      const q = query(collection(db, 'roadmap'), where('userId', '==', currentUser.uid), orderBy('createdAt', 'asc'));
      const querySnapshot = await getDocs(q);
      setRoadmapItems(querySnapshot.docs.map(doc => { return { id: doc.id, ...doc.data() }; }));
    };
    fetchRoadmap();
  }, [currentUser]);

  const addItem = async () => {
    if (newItem.trim() === '' || !currentUser) return;
    console.log("Attempting to add roadmap item with user ID:", currentUser.uid);
    await addDoc(collection(db, 'roadmap'), {
      text: newItem.trim(),
      userId: currentUser.uid,
      createdAt: serverTimestamp(),
      completed: false, // Added completed status
    });
    setNewItem('');
    const q = query(collection(db, 'roadmap'), where('userId', '==', currentUser.uid), orderBy('createdAt', 'asc'));
    const querySnapshot = await getDocs(q);
    setRoadmapItems(querySnapshot.docs.map(doc => { return { id: doc.id, ...doc.data() }; }));
  };

  const updateItem = async (id) => {
    if (editText.trim() === '' || !currentUser) return;
    console.log("Attempting to update roadmap item with user ID:", currentUser.uid);
    const itemRef = doc(db, 'roadmap', id);
    await updateDoc(itemRef, { text: editText.trim() });
    setEditingItem(null);
    setEditText('');
    const q = query(collection(db, 'roadmap'), where('userId', '==', currentUser.uid), orderBy('createdAt', 'asc'));
    const querySnapshot = await getDocs(q);
    setRoadmapItems(querySnapshot.docs.map(doc => { return { id: doc.id, ...doc.data() }; }));
  };

   const toggleComplete = async (item) => {
       if (!currentUser) return;
       console.log("Attempting to toggle complete roadmap item with user ID:", currentUser.uid);
       const itemRef = doc(db, 'roadmap', item.id);
       await updateDoc(itemRef, { completed: !item.completed });
       setRoadmapItems(roadmapItems.map(i => i.id === item.id ? { ...i, completed: !i.completed } : i));
   };


  const deleteItem = async (id) => {
    if (!currentUser) return;
    console.log("Attempting to delete roadmap item with user ID:", currentUser.uid);
    await deleteDoc(doc(db, 'roadmap', id));
    setRoadmapItems(roadmapItems.filter(item => item.id !== id));
  };

  // Static Smart Suggestions Functionality
  const generateRoadmapSuggestions = () => {
      const totalGoals = roadmapItems.length;
      const completedGoals = roadmapItems.filter(item => item.completed).length;
      const incompleteGoals = totalGoals - completedGoals;
      const oldestIncomplete = roadmapItems.filter(item => !item.completed).sort((a, b) => a.createdAt?.toDate() - b.createdAt?.toDate())[0];


      let suggestions = `**Roadmap Summary:**\n\n`;
      suggestions += `- You have **${totalGoals}** goals listed.\n`;
      suggestions += `- **${completedGoals}** goals are completed.\n`;
      suggestions += `- **${incompleteGoals}** goals are still in progress.\n\n`;

      suggestions += `**Suggestions:**\n`;
      if (incompleteGoals > 0) {
          if (incompleteGoals > 5) {
              suggestions += `- Consider prioritizing your top 3-5 most important goals to focus your energy.\n`;
          }
          if (oldestIncomplete) {
               suggestions += `- Your oldest incomplete goal is: "${oldestIncomplete.text}". Consider reviewing or breaking it down.\n`;
          } else if (incompleteGoals > 0) {
               suggestions += `- Review your incomplete goals. Are they still relevant? Can you break them into smaller steps?\n`;
          }
          suggestions += `- Link your incomplete roadmap goals to specific weekly actions to ensure progress.\n`;
      } else {
          suggestions += `- Great job completing all your goals! Consider adding new aspirations to your roadmap to keep growing.\n`;
          suggestions += `- Reflect on what strategies helped you achieve your goals and apply those to future plans.\n`;
      }
       if (totalGoals === 0) {
           suggestions = `**Roadmap Summary:**\n\n- You haven't added any goals yet.\n\n**Suggestions:**\n- Start by adding your long-term aspirations to the roadmap.\n- Think about what you want to achieve in the next 1, 5, or 10 years.\n`;
       }


      setSuggestionsText(suggestions);
      setShowSuggestions(true); // Always show suggestions after generating
      console.log("Generating static roadmap suggestions...");
  };


  return (
    <div id="roadmap" className="p-6 bg-white dark:bg-gray-800 rounded-xl shadow-md mb-6 transition-colors duration-200"> {/* Added dark mode */}
      <h3 className="text-2xl font-bold mb-6 text-gray-800 dark:text-gray-100 flex items-center"><Target className="mr-3 text-blue-600 dark:text-blue-400" size={28} /> Roadmap</h3> {/* Added dark mode */}

      {/* Smart Goal Suggestions Section */}
       <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900 rounded-lg border border-blue-200 dark:border-blue-700 transition-colors duration-200"> {/* Added dark mode */}
           <h4 className="text-lg font-semibold text-blue-800 dark:text-blue-300 mb-2 flex items-center"><Lightbulb size={20} className="mr-2"/> Smart Goal Suggestions</h4> {/* Updated heading and icon, dark mode */}
           <p className="text-blue-700 dark:text-blue-200 text-sm mb-3">Get smart analysis and suggestions to help you define and achieve your long-term goals more effectively.</p> {/* Updated description, dark mode */}
           <button
               className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200 transform hover:scale-105 flex items-center justify-center"
               onClick={generateRoadmapSuggestions} // Call the static suggestion function
           >
               {showSuggestions ? 'Refresh Suggestions' : 'Get Suggestions'} {/* Change button text */}
           </button>
            {showSuggestions && (
                <div className="mt-4 p-3 bg-blue-100 dark:bg-blue-800 rounded-lg border border-blue-300 dark:border-blue-600 text-blue-900 dark:text-blue-100 whitespace-pre-wrap transition-colors duration-200"> {/* Added dark mode */}
                    <ReactMarkdown>{suggestionsText}</ReactMarkdown> {/* Use ReactMarkdown */}
                     <button
                        className="mt-3 text-blue-700 hover:text-blue-900 text-sm font-semibold flex items-center dark:text-blue-300 dark:hover:text-blue-100" // Dark mode
                        onClick={() => setShowSuggestions(false)} // Hide suggestions
                    >
                        Hide Suggestions <ChevronUp size={16} className="ml-1"/>
                    </button>
                </div>
            )}
       </div>


      <div className="mb-6 flex flex-col sm:flex-row gap-3">
        <input
          type="text"
          className="shadow-sm appearance-none border border-gray-300 dark:border-gray-600 rounded-lg w-full py-3 px-4 text-gray-700 dark:text-gray-200 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200 bg-white dark:bg-gray-700" // Dark mode
          placeholder="Add new roadmap item"
          value={newItem}
          onChange={(e) => setNewItem(e.target.value)}
        />
        <button
          className="bg-gray-800 hover:bg-gray-700 text-white font-bold py-3 px-6 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-transparent transition duration-200 transform hover:scale-105 flex-shrink-0 flex items-center justify-center dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-gray-200" // Minimal button style, dark mode
          onClick={addItem}
        >
          <Plus className="mr-2" size={20} /> Add
        </button>
      </div>
      <ul>
        {roadmapItems.map(item => (
          <li key={item.id} className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg mb-3 flex flex-col sm:flex-row justify-between items-start sm:items-center border border-gray-200 dark:border-gray-600 shadow-sm transition-colors duration-200"> {/* Dark mode */}
            {editingItem === item.id ? (
              <input
                type="text"
                className="shadow-sm appearance-none border border-gray-300 dark:border-gray-600 rounded-lg py-2 px-3 text-gray-700 dark:text-gray-200 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200 mr-2 flex-grow w-full sm:w-auto mb-2 sm:mb-0 bg-white dark:bg-gray-800" // Dark mode
                value={editText}
                onChange={(e) => setEditText(e.target.value)}
              />
            ) : (
              <span className={`flex-grow text-gray-800 dark:text-gray-100 text-lg mr-2 mb-2 sm:mb-0 ${item.completed ? 'line-through text-gray-500 dark:text-gray-400' : ''}`}>{item.text}</span> // Dark mode
            )}
            <div className="flex gap-2 flex-shrink-0">
                 <button
                    className={`text-sm py-2 px-4 rounded-lg transition duration-200 transform hover:scale-105 flex items-center justify-center ${item.completed ? 'bg-gray-500 hover:bg-gray-600 text-white dark:bg-gray-600 dark:hover:bg-gray-500 dark:text-gray-200' : 'bg-gray-800 hover:bg-gray-700 text-white dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-gray-200'}`} // Minimal button style, dark mode
                    onClick={() => toggleComplete(item)}
                    >
                     {item.completed ? <X size={16} className="mr-1 sm:mr-1"/> : <Check size={16} className="mr-1 sm:mr-1"/>} <span className="hidden sm:inline">{item.completed ? 'Undo' : 'Complete'}</span> {/* Hide text on small screens */}
                </button>
              {editingItem === item.id ? (
                <button
                  className="bg-gray-800 hover:bg-gray-700 text-white text-sm py-2 px-4 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-transparent transition duration-200 transform hover:scale-105 flex items-center justify-center dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-gray-200" // Minimal button style, dark mode
                  onClick={() => updateItem(item.id)}
                >
                  <Save size={16} className="mr-1 sm:mr-1"/> <span className="hidden sm:inline">Save</span> {/* Hide text on small screens */}
                </button>
              ) : (
                <button
                  className="bg-gray-200 hover:bg-gray-300 text-gray-800 text-sm py-2 px-4 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-400 focus:border-transparent transition duration-200 transform hover:scale-105 flex items-center justify-center dark:bg-gray-600 dark:hover:bg-gray-500 dark:text-gray-200" // Minimal button style, dark mode
                  onClick={() => { setEditingItem(item.id); setEditText(item.text); }}
                >
                  <Edit size={16} className="mr-1 sm:mr-1"/> <span className="hidden sm:inline">Edit</span> {/* Hide text on small screens */}
                </button>
              )}
              <button
                className="bg-red-600 hover:bg-red-700 text-white text-sm py-2 px-4 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition duration-200 transform hover:scale-105 flex items-center justify-center" // Destructive action color
                onClick={() => deleteItem(item.id)}
              >
                <Trash2 size={16} className="mr-1 sm:mr-1"/> <span className="hidden sm:inline">Delete</span> {/* Hide text on small screens */}
              </button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
};

const WeeklyActions = () => {
    const { currentUser } = useAuth();
    const [actions, setActions] = useState([]);
    const [newAction, setNewAction] = useState('');
    const [editingAction, setEditingAction] = useState(null);
    const [editText, setEditText] = useState('');
    const [showSuggestions, setShowSuggestions] = useState(false); // State to toggle suggestions visibility
    const [suggestionsText, setSuggestionsText] = useState(''); // State to hold suggestions


    useEffect(() => {
        const fetchActions = async () => {
            if (!currentUser) {
                console.log("WeeklyActions: No user logged in, skipping fetch.");
                return;
            }
            const q = query(collection(db, 'weeklyActions'), where('userId', '==', currentUser.uid), orderBy('createdAt', 'asc'));
            const querySnapshot = await getDocs(q);
            setActions(querySnapshot.docs.map(doc => { return { id: doc.id, ...doc.data() }; }));
        };
        fetchActions();
    }, [currentUser]);

    const addAction = async () => {
        if (newAction.trim() === '' || !currentUser) return;
        console.log("Attempting to add weekly action with user ID:", currentUser.uid);
        await addDoc(collection(db, 'weeklyActions'), {
            text: newAction.trim(),
            userId: currentUser.uid,
            completed: false,
            createdAt: serverTimestamp(),
        });
        setNewAction('');
        const q = query(collection(db, 'weeklyActions'), where('userId', '==', currentUser.uid), orderBy('createdAt', 'asc'));
        const querySnapshot = await getDocs(q);
        setActions(querySnapshot.docs.map(doc => { return { id: doc.id, ...doc.data() }; }));
    };

    const updateAction = async (id) => {
        if (editText.trim() === '' || !currentUser) return;
        console.log("Attempting to update weekly action with user ID:", currentUser.uid);
        const actionRef = doc(db, 'weeklyActions', id);
        await updateDoc(actionRef, { text: editText.trim() });
        setEditingAction(null);
        setEditText('');
        const q = query(collection(db, 'weeklyActions'), where('userId', '==', currentUser.uid), orderBy('createdAt', 'asc'));
        const querySnapshot = await getDocs(q);
        setActions(querySnapshot.docs.map(doc => { return { id: doc.id, ...doc.data() }; }));
    };

    const toggleComplete = async (action) => {
         if (!currentUser) return;
         console.log("Attempting to toggle complete weekly action with user ID:", currentUser.uid);
        const actionRef = doc(db, 'weeklyActions', action.id);
        await updateDoc(actionRef, { completed: !action.completed });
        setActions(actions.map(a => a.id === action.id ? { ...a, completed: !a.completed } : a));
    };


    const deleteAction = async (id) => {
         if (!currentUser) return;
         console.log("Attempting to delete weekly action with user ID:", currentUser.uid);
        await deleteDoc(doc(db, 'weeklyActions', id));
        setActions(actions.filter(action => action.id !== id));
    };

     // Static Smart Suggestions Functionality
    const generateActionSuggestions = () => {
        const totalActions = actions.length;
        const completedActions = actions.filter(action => action.completed).length;
        const incompleteActions = totalActions - completedActions;

        let suggestions = `**Weekly Actions Summary:**\n\n`;
        suggestions += `- You have **${totalActions}** weekly actions listed.\n`;
        suggestions += `- **${completedActions}** actions are completed.\n`;
        suggestions += `- **${incompleteActions}** actions are still in progress.\n\n`;

        suggestions += `**Suggestions:**\n`;
        if (incompleteActions > 0) {
             if (incompleteActions > 3) {
                 suggestions += `- Focus on completing your top 3 most important actions this week.\n`;
             }
            const incompleteList = actions.filter(action => !action.completed).map(action => `- "${action.text}"`).join('\n');
            if (incompleteList) {
                 suggestions += `Missed Actions:\n${incompleteList}\n`; // Changed from "Review these incomplete actions"
                 suggestions += `-- Can any be broken down or rescheduled?\n`;
            }
            suggestions += `- Ensure your weekly actions are aligned with your long-term roadmap goals.\n`;
        } else {
             suggestions += `- All weekly actions completed! Excellent progress.\n`;
             suggestions += `- Plan your actions for the upcoming week based on your roadmap and daily habits.\n`;
        }
         if (totalActions === 0) {
            suggestions = `**Weekly Actions Summary:**\n\n- You haven't added any weekly actions yet.\n\n**Suggestions:**\n- Break down your roadmap goals into smaller, actionable steps for this week.\n- What specific tasks will move you closer to your goals this week?\n`;
        }

        setSuggestionsText(suggestions);
        setShowSuggestions(true); // Always show suggestions after generating
        console.log("Generating static action suggestions...");
    };


    return (
        <div id="weeklyActions" className="p-6 bg-white dark:bg-gray-800 rounded-xl shadow-md mb-6 transition-colors duration-200"> {/* Added dark mode */}
            <h3 className="text-2xl font-bold mb-6 text-gray-800 dark:text-gray-100 flex items-center"><CalendarDays className="mr-3 text-blue-600 dark:text-blue-400" size={28} /> Weekly Actions</h3> {/* Added dark mode */}

             {/* Smart Action Suggestions Section */}
             <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900 rounded-lg border border-blue-200 dark:border-blue-700 transition-colors duration-200"> {/* Added dark mode */}
                 <h4 className="text-lg font-semibold text-blue-800 dark:text-blue-300 mb-2 flex items-center"><Lightbulb size={20} className="mr-2"/> Smart Action Suggestions</h4> {/* Updated heading and icon, dark mode */}
                 <p className="text-blue-700 dark:text-blue-200 text-sm mb-3">Get smart suggestions for your weekly tasks based on your goals and progress.</p> {/* Updated description, dark mode */}
                 <button
                     className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200 transform hover:scale-105 flex items-center justify-center"
                     onClick={generateActionSuggestions} // Call the static suggestion function
                 >
                     {showSuggestions ? 'Refresh Suggestions' : 'Get Suggestions'} {/* Change button text */}
                 </button>
                 {showSuggestions && (
                     <div className="mt-4 p-3 bg-blue-100 dark:bg-blue-800 rounded-lg border border-blue-300 dark:border-blue-600 text-blue-900 dark:text-blue-100 whitespace-pre-wrap transition-colors duration-200"> {/* Added dark mode */}
                         <ReactMarkdown>{suggestionsText}</ReactMarkdown> {/* Use ReactMarkdown */}
                          <button
                            className="mt-3 text-blue-700 hover:text-blue-900 text-sm font-semibold flex items-center dark:text-blue-300 dark:hover:text-blue-100" // Dark mode
                            onClick={() => setShowSuggestions(false)} // Hide suggestions
                        >
                            Hide Suggestions <ChevronUp size={16} className="ml-1"/>
                        </button>
                     </div>
                 )}
             </div>


            <div className="mb-6 flex flex-col sm:flex-row gap-3">
                <input
                    type="text"
                    className="shadow-sm appearance-none border border-gray-300 dark:border-gray-600 rounded-lg w-full py-3 px-4 text-gray-700 dark:text-gray-200 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200 bg-white dark:bg-gray-700" // Dark mode
                    placeholder="Add new weekly action"
                    value={newAction}
                    onChange={(e) => setNewAction(e.target.value)}
                />
                <button
                  className="bg-gray-800 hover:bg-gray-700 text-white font-bold py-3 px-6 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-transparent transition duration-200 transform hover:scale-105 flex-shrink-0 flex items-center justify-center dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-gray-200" // Minimal button style, dark mode
                  onClick={addAction}
                >
                  <Plus className="mr-2" size={20} /> Add
                </button>
            </div>
            <ul>
                {actions.map(action => (
                    <li key={action.id} className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg mb-3 flex flex-col sm:flex-row justify-between items-start sm:items-center border border-gray-200 dark:border-gray-600 shadow-sm transition-colors duration-200"> {/* Dark mode */}
                        {editingAction === action.id ? (
                            <input
                                type="text"
                                className="shadow-sm appearance-none border border-gray-300 dark:border-gray-600 rounded-lg py-2 px-3 text-gray-700 dark:text-gray-200 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200 mr-2 flex-grow w-full sm:w-auto mb-2 sm:mb-0 bg-white dark:bg-gray-800" // Dark mode
                                value={editText}
                                onChange={(e) => setEditText(e.target.value)}
                            />
                        ) : (
                            <span className={`flex-grow text-gray-800 dark:text-gray-100 text-lg mr-2 mb-2 sm:mb-0 ${action.completed ? 'line-through text-gray-500 dark:text-gray-400' : ''}`}>{action.text}</span> // Dark mode
                        )}
                        <div className="flex gap-2 flex-shrink-0">
                             <button
                                className={`text-sm py-2 px-4 rounded-lg transition duration-200 transform hover:scale-105 flex items-center justify-center ${action.completed ? 'bg-gray-500 hover:bg-gray-600 text-white dark:bg-gray-600 dark:hover:bg-gray-500 dark:text-gray-200' : 'bg-gray-800 hover:bg-gray-700 text-white dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-gray-200'}`} // Minimal button style, dark mode
                                onClick={() => toggleComplete(action)}
                                >
                                 {action.completed ? <X size={16} className="mr-1 sm:mr-1"/> : <Check size={16} className="mr-1 sm:mr-1"/>} <span className="hidden sm:inline">{action.completed ? 'Undo' : 'Complete'}</span> {/* Hide text on small screens */}
                            </button>
                            {editingAction === action.id ? (
                                <button
                                    className="bg-gray-800 hover:bg-gray-700 text-white text-sm py-2 px-4 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-transparent transition duration-200 transform hover:scale-105 flex items-center justify-center dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-gray-200" // Minimal button style, dark mode
                                    onClick={() => updateAction(action.id)}
                                >
                                    <Save size={16} className="mr-1 sm:mr-1"/> <span className="hidden sm:inline">Save</span> {/* Hide text on small screens */}
                                </button>
                            ) : (
                                <button
                                    className="bg-gray-200 hover:bg-gray-300 text-gray-800 text-sm py-2 px-4 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-400 focus:border-transparent transition duration-200 transform hover:scale-105 flex items-center justify-center dark:bg-gray-600 dark:hover:bg-gray-500 dark:text-gray-200" // Minimal button style, dark mode
                                    onClick={() => { setEditingAction(action.id); setEditText(action.text); }}
                                >
                                    <Edit size={16} className="mr-1 sm:mr-1"/> <span className="hidden sm:inline">Edit</span> {/* Hide text on small screens */}
                                </button>
                            )}
                            <button
                                className="bg-red-600 hover:bg-red-700 text-white text-sm py-2 px-4 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition duration-200 transform hover:scale-105 flex items-center justify-center" // Destructive action color
                                onClick={() => deleteAction(action.id)}
                              >
                                <Trash2 size={16} className="mr-1 sm:mr-1"/> <span className="hidden sm:inline">Delete</span> {/* Hide text on small screens */}
                              </button>
                        </div>
                    </li>
                ))}
            </ul>
        </div>
    );
};

const DailyHabits = () => {
    const { currentUser } = useAuth();
    const [habits, setHabits] = useState([]);
    const [newHabit, setNewHabit] = useState('');
    const [editingHabit, setEditingHabit] = useState(null);
    const [editText, setEditText] = useState('');
    const [showSuggestions, setShowSuggestions] = useState(false); // State to toggle suggestions visibility
    const [suggestionsText, setSuggestionsText] = useState(''); // State to hold suggestions


    useEffect(() => {
        const fetchHabits = async () => {
            if (!currentUser) {
                console.log("DailyHabits: No user logged in, skipping fetch.");
                return;
            }
            const q = query(collection(db, 'dailyHabits'), where('userId', '==', currentUser.uid), orderBy('createdAt', 'asc'));
            const querySnapshot = await getDocs(q);
            setHabits(querySnapshot.docs.map(doc => { return { id: doc.id, ...doc.data() }; }));
        };
        fetchHabits();
    }, [currentUser]);

    const addHabit = async () => {
        if (newHabit.trim() === '' || !currentUser) return;
        console.log("Attempting to add daily habit with user ID:", currentUser.uid);
        await addDoc(collection(db, 'dailyHabits'), {
            text: newHabit.trim(),
            userId: currentUser.uid,
            completedToday: false,
            streak: 0,
            lastCompletedAt: null,
            createdAt: serverTimestamp(),
        });
        setNewHabit('');
        const q = query(collection(db, 'dailyHabits'), where('userId', '==', currentUser.uid), orderBy('createdAt', 'asc'));
        const querySnapshot = await getDocs(q);
        setHabits(querySnapshot.docs.map(doc => { return { id: doc.id, ...doc.data() }; }));
    };

    const updateHabit = async (id) => {
        if (editText.trim() === '' || !currentUser) return;
        console.log("Attempting to update daily habit with user ID:", currentUser.uid);
        const habitRef = doc(db, 'dailyHabits', id);
        await updateDoc(habitRef, { text: editText.trim() });
        setEditingHabit(null);
        setEditText('');
        const q = query(collection(db, 'dailyHabits'), where('userId', '==', currentUser.uid), orderBy('createdAt', 'asc'));
        const querySnapshot = await getDocs(q);
        setHabits(querySnapshot.docs.map(doc => { return { id: doc.id, ...doc.data() }; }));
    };

     const toggleCompleteToday = async (habit) => {
        if (!currentUser) return;
        console.log("Attempting to toggle complete daily habit with user ID:", currentUser.uid);

        const habitRef = doc(db, 'dailyHabits', habit.id);
        const now = Timestamp.now();
        const today = new Date(now.toDate().getFullYear(), now.toDate().getMonth(), now.toDate().getDate());

        let newStreak = habit.streak || 0;
        let newLastCompletedAt = habit.lastCompletedAt;
        let newCompletedToday = !habit.completedToday;

        if (newCompletedToday) {
            if (habit.lastCompletedAt) {
                 const lastCompletedDate = new Date(habit.lastCompletedAt.toDate().getFullYear(), habit.lastCompletedAt.toDate().getMonth(), habit.lastCompletedAt.toDate().getDate());
                 const yesterday = new Date(today);
                 yesterday.setDate(today.getDate() - 1);

                 if (lastCompletedDate.getTime() === yesterday.getTime()) {
                     newStreak = (habit.streak || 0) + 1;
                 } else if (lastCompletedDate.getTime() !== today.getTime()) { // Completed today, but not yesterday (streak broken or first day)
                     newStreak = 1;
                 }
                 // If lastCompletedDate is today, streak doesn't change (already counted)
            } else { // First time completing this habit
                 newStreak = 1;
            }
            newLastCompletedAt = now;
        } else { // Marking as incomplete today
             // If the habit was completed today, and we unmark it, the streak is broken unless it was also completed yesterday
             if (habit.lastCompletedAt) {
                 const lastCompletedDate = new Date(habit.lastCompletedAt.toDate().getFullYear(), habit.lastCompletedAt.toDate().getMonth(), habit.lastCompletedAt.toDate().getDate());
                 const yesterday = new Date(today);
                 yesterday.setDate(today.getDate() - 1);

                  // If the last completion was yesterday, unmarking today breaks the streak
                 if (lastCompletedDate.getTime() === yesterday.getTime()) {
                      newStreak = 0; // Streak broken
                 }
                 // If the last completion was today, unmarking it just resets completedToday and lastCompletedAt
                 if (lastCompletedDate.getTime() === today.getTime()) {
                      newLastCompletedAt = null;
                 }
             } else {
                 newStreak = 0;
             }
             newCompletedToday = false; // Explicitly set to false
        }


        await updateDoc(habitRef, {
            completedToday: newCompletedToday,
            streak: newStreak,
            lastCompletedAt: newLastCompletedAt,
        });

        setHabits(habits.map(h => h.id === habit.id ? { ...h, completedToday: newCompletedToday, streak: newStreak, lastCompletedAt: newLastCompletedAt } : h));
    };


    const deleteHabit = async (id) => {
         if (!currentUser) return;
         console.log("Attempting to delete daily habit with user ID:", currentUser.uid);
        await deleteDoc(doc(db, 'dailyHabits', id));
        setHabits(habits.filter(habit => habit.id !== id));
    };

    useEffect(() => {
        const checkAndResetStreaks = async () => {
            if (!currentUser || habits.length === 0) return;

            const now = Timestamp.now();
            const today = new Date(now.toDate().getFullYear(), now.toDate().getMonth(), now.toDate().getDate());

            const updates = [];
            habits.forEach(habit => {
                if (habit.lastCompletedAt) {
                    const lastCompletedDate = new Date(habit.lastCompletedAt.toDate().getFullYear(), habit.lastCompletedAt.toDate().getMonth(), habit.lastCompletedAt.toDate().getDate());
                    const yesterday = new Date(today);
                    yesterday.setDate(today.getDate() - 1);

                    // If last completed was before yesterday and streak > 0, reset streak
                    if (lastCompletedDate.getTime() < yesterday.getTime() && habit.streak > 0) {
                         const habitRef = doc(db, 'dailyHabits', habit.id);
                         updates.push(updateDoc(habitRef, { streak: 0, completedToday: false }));
                         console.log(`Resetting streak for habit ${habit.id}`);
                    }
                    // If last completed was before today and completedToday is true, reset completedToday
                    else if (lastCompletedDate.getTime() < today.getTime() && habit.completedToday) {
                         const habitRef = doc(db, 'dailyHabits', habit.id);
                         updates.push(updateDoc(habitRef, { completedToday: false }));
                         console.log(`Resetting completedToday for habit ${habit.id}`);
                    }
                } else if (habit.streak > 0 || habit.completedToday) {
                     // Handle cases where lastCompletedAt might be null but streak/completedToday is true (shouldn't happen with correct logic, but as a safeguard)
                     const habitRef = doc(db, 'dailyHabits', habit.id);
                     updates.push(updateDoc(habitRef, { streak: 0, completedToday: false }));
                      console.log(`Resetting streak/completedToday for habit ${habit.id} (no lastCompletedAt)`);
                }
            });

            if (updates.length > 0) {
                await Promise.all(updates);
                 const q = query(collection(db, 'dailyHabits'), where('userId', '==', currentUser.uid), orderBy('createdAt', 'asc'));
                 const querySnapshot = await getDocs(q);
                 setHabits(querySnapshot.docs.map(doc => { return { id: doc.id, ...doc.data() }; }));
            }
        };

        checkAndResetStreaks();
         const now = new Date();
         const tomorrow = new Date(now);
         tomorrow.setDate(now.getDate() + 1);
         tomorrow.setHours(0, 0, 0, 0);

         const timeUntilTomorrow = tomorrow.getTime() - now.getTime();

         const timer = setTimeout(checkAndResetStreaks, timeUntilTomorrow);

         return () => clearTimeout(timer);

    }, [habits, currentUser]);

     // Static Smart Suggestions Functionality
    const generateHabitSuggestions = () => {
        const totalHabits = habits.length;
        const completedToday = habits.filter(habit => habit.completedToday).length;
        const habitsWithStreaks = habits.filter(habit => habit.streak > 0).length;
        const longestStreak = habits.reduce((max, habit) => Math.max(max, habit.streak || 0), 0);
        const incompleteHabitsToday = habits.filter(habit => !habit.completedToday);


        let suggestions = `**Daily Habits Summary:**\n\n`;
        suggestions += `- You are tracking **${totalHabits}** daily habits.\n`;
        suggestions += `- You completed **${completedToday}** habits today.\n`;
        suggestions += `- **${habitsWithStreaks}** habits currently have a streak.\n`;
        suggestions += `- Your longest current streak is **${longestStreak}** days.\n\n`;

        suggestions += `**Suggestions:**\n`;
        if (completedToday < totalHabits) {
             suggestions += `- You missed ${incompleteHabitsToday.length} habit(s) today.\n`;
             const missedList = incompleteHabitsToday.map(habit => `- "${habit.text}"`).join('\n');
             if (missedList) {
                  suggestions += `Missed Habits:\n${missedList}\n`;
             }
             suggestions += `-- Try to complete all your habits tomorrow for a perfect day!\n`;
             suggestions += `- Identify potential blockers for the habits you missed today.\n`;
        } else {
             suggestions += `- Excellent job completing all your habits today! Keep the momentum going.\n`;
             suggestions += `- Consider adding a new habit to challenge yourself.\n`;
        }
         if (totalHabits === 0) {
            suggestions = `**Daily Habits Summary:**\n\n- You haven't added any daily habits yet.\n\n**Suggestions:**\n- What small actions can you do daily to support your weekly actions and roadmap goals?\n- Start with 1-2 simple habits to build consistency.\n`;
        }


        setSuggestionsText(suggestions);
        setShowSuggestions(true); // Always show suggestions after generating
        console.log("Generating static habit suggestions...");
    };


    return (
        <div id="dailyHabits" className="p-6 bg-white dark:bg-gray-800 rounded-xl shadow-md mb-6 transition-colors duration-200"> {/* Added dark mode */}
            <h3 className="text-2xl font-bold mb-6 text-gray-800 dark:text-gray-100 flex items-center"><ListTodo className="mr-3 text-blue-600 dark:text-blue-400" size={28} /> Daily Habits</h3> {/* Added dark mode */}

             {/* Smart Habit Insights Section */}
             <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900 rounded-lg border border-blue-200 dark:border-blue-700 transition-colors duration-200"> {/* Added dark mode */}
                 <h4 className="text-lg font-semibold text-blue-800 dark:text-blue-300 mb-2 flex items-center"><Lightbulb size={20} className="mr-2"/> Smart Habit Insights</h4> {/* Updated heading and icon, dark mode */}
                 <p className="text-blue-700 dark:text-blue-200 text-sm mb-3">Get smart analysis and strategies to help you build and maintain consistent daily habits.</p> {/* Updated description, dark mode */}
                 <button
                     className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200 transform hover:scale-105 flex items-center justify-center"
                     onClick={generateHabitSuggestions} // Call the static suggestion function
                 >
                     {showSuggestions ? 'Refresh Insights' : 'Get Insights'} {/* Change button text */}
                 </button>
                 {showSuggestions && (
                     <div className="mt-4 p-3 bg-blue-100 dark:bg-blue-800 rounded-lg border border-blue-300 dark:border-blue-600 text-blue-900 dark:text-blue-100 whitespace-pre-wrap transition-colors duration-200"> {/* Added dark mode */}
                         <ReactMarkdown>{suggestionsText}</ReactMarkdown> {/* Use ReactMarkdown */}
                          <button
                            className="mt-3 text-blue-700 hover:text-blue-900 text-sm font-semibold flex items-center dark:text-blue-300 dark:hover:text-blue-100" // Dark mode
                            onClick={() => setShowSuggestions(false)} // Hide suggestions
                        >
                            Hide Suggestions <ChevronUp size={16} className="ml-1"/>
                        </button>
                     </div>
                 )}
             </div>


            <div className="mb-6 flex flex-col sm:flex-row gap-3">
                <input
                    type="text"
                    className="shadow-sm appearance-none border border-gray-300 dark:border-gray-600 rounded-lg w-full py-3 px-4 text-gray-700 dark:text-gray-200 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200 bg-white dark:bg-gray-700" // Dark mode
                    placeholder="Add new daily habit"
                    value={newHabit}
                    onChange={(e) => setNewHabit(e.target.value)}
                />
                 <button
                  className="bg-gray-800 hover:bg-gray-700 text-white font-bold py-3 px-6 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-transparent transition duration-200 transform hover:scale-105 flex-shrink-0 flex items-center justify-center dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-gray-200" // Minimal button style, dark mode
                  onClick={addHabit}
                >
                  <Plus className="mr-2" size={20} /> Add
                </button>
            </div>
            <ul>
                {habits.map(habit => (
                    <li key={habit.id} className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg mb-3 flex flex-col sm:flex-row justify-between items-start sm:items-center border border-gray-200 dark:border-gray-600 shadow-sm transition-colors duration-200"> {/* Dark mode */}
                        {editingHabit === habit.id ? (
                            <input
                                type="text"
                                className="shadow-sm appearance-none border border-gray-300 dark:border-gray-600 rounded-lg py-2 px-3 text-gray-700 dark:text-gray-200 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200 mr-2 flex-grow w-full sm:w-auto mb-2 sm:mb-0 bg-white dark:bg-gray-800" // Dark mode
                                value={editText}
                                onChange={(e) => setEditText(e.target.value)}
                            />
                        ) : (
                            <span className={`flex-grow text-gray-800 dark:text-gray-100 text-lg mr-2 mb-2 sm:mb-0 ${habit.completedToday ? 'line-through text-gray-500 dark:text-gray-400' : ''}`}>
                                {habit.text} <span className="text-sm font-semibold text-blue-600 dark:text-blue-400">({habit.streak || 0} day streak)</span> {/* Dark mode */}
                            </span>
                        )}
                        <div className="flex gap-2 flex-shrink-0">
                            <button
                                className={`text-sm py-2 px-4 rounded-lg transition duration-200 transform hover:scale-105 flex items-center justify-center ${habit.completedToday ? 'bg-gray-500 hover:bg-gray-600 text-white dark:bg-gray-600 dark:hover:bg-gray-500 dark:text-gray-200' : 'bg-gray-800 hover:bg-gray-700 text-white dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-gray-200'}`} // Minimal button style, dark mode
                                onClick={() => toggleCompleteToday(habit)}
                                >
                                {habit.completedToday ? <X size={16} className="mr-1 sm:mr-1"/> : <Check size={16} className="mr-1 sm:mr-1"/>} <span className="hidden sm:inline">{habit.completedToday ? 'Undo' : 'Done Today'}</span> {/* Hide text on small screens */}
                            </button>
                            {editingHabit === habit.id ? (
                                <button
                                    className="bg-gray-800 hover:bg-gray-700 text-white text-sm py-2 px-4 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-transparent transition duration-200 transform hover:scale-105 flex items-center justify-center dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-gray-200" // Minimal button style, dark mode
                                    onClick={() => updateHabit(habit.id)}
                                >
                                    <Save size={16} className="mr-1 sm:mr-1"/> <span className="hidden sm:inline">Save</span> {/* Hide text on small screens */}
                                </button>
                            ) : (
                                <button
                                    className="bg-gray-200 hover:bg-gray-300 text-gray-800 text-sm py-2 px-4 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-400 focus:border-transparent transition duration-200 transform hover:scale-105 flex items-center justify-center dark:bg-gray-600 dark:hover:bg-gray-500 dark:text-gray-200" // Minimal button style, dark mode
                                    onClick={() => { setEditingHabit(habit.id); setEditText(habit.text); }}
                                >
                                    <Edit size={16} className="mr-1 sm:mr-1"/> <span className="hidden sm:inline">Edit</span> {/* Hide text on small screens */}
                                </button>
                            )}
                            <button
                                className="bg-red-600 hover:bg-red-700 text-white text-sm py-2 px-4 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition duration-200 transform hover:scale-105 flex items-center justify-center" // Destructive action color
                                onClick={() => deleteHabit(habit.id)}
                              >
                                <Trash2 size={16} className="mr-1 sm:mr-1"/> <span className="hidden sm:inline">Delete</span> {/* Hide text on small screens */}
                              </button>
                        </div>
                    </li>
                ))}
            </ul>
        </div>
    );
};

const SkillHoursLog = () => {
    const { currentUser } = useAuth();
    const [logs, setLogs] = useState([]);
    const [skills, setSkills] = useState([]);
    const [newSkillName, setNewSkillName] = useState('');
    const [selectedSkill, setSelectedSkill] = useState('');
    const [hours, setHours] = useState('');
    const [editingLog, setEditingLog] = useState(null);
    const [editSkillLogSkill, setEditSkillLogSkill] = useState('');
    const [editSkillLogHours, setEditSkillLogHours] = useState('');
    const [showAddSkillModal, setShowAddSkillModal] = useState(false); // State for Add Skill Modal
    const [showManageSkills, setShowManageSkills] = useState(false); // State for Manage Skills Section
    const [editingSkill, setEditingSkill] = useState(null); // State for editing a skill name
    const [editSkillName, setEditSkillName] = useState(''); // State for editing skill name input
    const [showSuggestions, setShowSuggestions] = useState(false); // State to toggle suggestions visibility
    const [suggestionsText, setSuggestionsText] = useState(''); // State to hold suggestions


    useEffect(() => {
        const fetchLogs = async () => {
            if (!currentUser) {
                console.log("SkillHoursLog: No user logged in, skipping logs fetch.");
                return;
            }
            const q = query(collection(db, 'skillLogs'), where('userId', '==', currentUser.uid), orderBy('timestamp', 'desc'));
            const querySnapshot = await getDocs(q);
            setLogs(querySnapshot.docs.map(doc => { return { id: doc.id, ...doc.data() }; }));
        };
        fetchLogs();
    }, [currentUser]);

    useEffect(() => {
        const fetchSkills = async () => {
            if (!currentUser) {
                console.log("SkillHoursLog: No user logged in, skipping skills fetch.");
                return;
            }
             const q = query(collection(db, 'skills'), where('userId', '==', currentUser.uid), orderBy('skillName', 'asc'));
             const querySnapshot = await getDocs(q);
             const fetchedSkills = querySnapshot.docs.map(doc => { return { id: doc.id, ...doc.data() }; });
             setSkills(fetchedSkills);
             if (fetchedSkills.length > 0) {
                 setSelectedSkill(fetchedSkills[0].skillName);
             } else {
                 setSelectedSkill('');
             }
        };
        fetchSkills();
    }, [currentUser]);

    const addNewSkill = async () => {
        if (newSkillName.trim() === '' || !currentUser) return;

        const skillExists = skills.some(skill => skill.skillName.toLowerCase() === newSkillName.trim().toLowerCase());
        if (skillExists) {
            alert('This skill already exists!');
            return; // Prevent adding duplicate skill
        }

        console.log("Attempting to add new skill with user ID:", currentUser.uid);
        await addDoc(collection(db, 'skills'), {
            skillName: newSkillName.trim(),
            userId: currentUser.uid,
            createdAt: serverTimestamp(),
        });
        setNewSkillName('');
        setShowAddSkillModal(false); // Close modal after adding

        // Re-fetch skills to update the list and select dropdown
        const q = query(collection(db, 'skills'), where('userId', '==', currentUser.uid), orderBy('skillName', 'asc'));
        const querySnapshot = await getDocs(q);
        const fetchedSkills = querySnapshot.docs.map(doc => { return { id: doc.id, ...doc.data() }; });
        setSkills(fetchedSkills);
         if (fetchedSkills.length > 0 && !selectedSkill) {
             setSelectedSkill(fetchedSkills[0].skillName);
         }
    };

     const updateSkillName = async (skillId) => {
        if (editSkillName.trim() === '' || !currentUser) return;

         const skillExists = skills.some(skill => skill.id !== skillId && skill.skillName.toLowerCase() === editSkillName.trim().toLowerCase());
        if (skillExists) {
            alert('A skill with this name already exists!');
            return; // Prevent renaming to a duplicate skill name
        }

        console.log("Attempting to update skill name with user ID:", currentUser.uid);
        const skillRef = doc(db, 'skills', skillId);
        await updateDoc(skillRef, { skillName: editSkillName.trim() });
        setEditingSkill(null);
        setEditSkillName('');

        // Re-fetch skills and logs to update lists and reflect the name change
        const skillsQ = query(collection(db, 'skills'), where('userId', '==', currentUser.uid), orderBy('skillName', 'asc'));
        const skillsSnapshot = await getDocs(skillsQ);
        const fetchedSkills = skillsSnapshot.docs.map(doc => { return { id: doc.id, ...doc.data() }; });
        setSkills(fetchedSkills);

         const logsQ = query(collection(db, 'skillLogs'), where('userId', '==', currentUser.uid), orderBy('timestamp', 'desc'));
         const logsSnapshot = await getDocs(logsQ);
         setLogs(logsSnapshot.docs.map(doc => { return { id: doc.id, ...doc.data() }; }));

         // Update selected skill if the edited skill was selected
         if (selectedSkill === skills.find(s => s.id === skillId)?.skillName) {
             setSelectedSkill(editSkillName.trim());
         }
    };

    const deleteSkill = async (skillId) => {
         if (!currentUser) return;

         // Optional: Add a confirmation dialog before deleting a skill
         if (!window.confirm('Are you sure you want to delete this skill and all associated logs?')) {
             return;
         }

         console.log("Attempting to delete skill with user ID:", currentUser.uid);

         // Delete associated skill logs first
         const logsToDeleteQ = query(collection(db, 'skillLogs'), where('userId', '==', currentUser.uid), where('skill', '==', skills.find(s => s.id === skillId)?.skillName));
         const logsToDeleteSnapshot = await getDocs(logsToDeleteQ);
         const deleteLogPromises = logsToDeleteSnapshot.docs.map(logDoc => deleteDoc(doc(db, 'skillLogs', logDoc.id)));
         await Promise.all(deleteLogPromises);

         // Then delete the skill
         await deleteDoc(doc(db, 'skills', skillId));

         // Re-fetch skills and logs
         const skillsQ = query(collection(db, 'skills'), where('userId', '==', currentUser.uid), orderBy('skillName', 'asc'));
         const skillsSnapshot = await getDocs(skillsQ);
         const fetchedSkills = skillsSnapshot.docs.map(doc => { return { id: doc.id, ...doc.data() }; });
         setSkills(fetchedSkills);

         const logsQ = query(collection(db, 'skillLogs'), where('userId', '==', currentUser.uid), orderBy('timestamp', 'desc'));
         const logsSnapshot = await getDocs(logsQ);
         setLogs(logsSnapshot.docs.map(doc => { return { id: doc.id, ...doc.data() }; }));

         // Reset selected skill if the deleted skill was selected
         if (selectedSkill === skills.find(s => s.id === skillId)?.skillName) {
             setSelectedSkill(fetchedSkills.length > 0 ? fetchedSkills[0].skillName : '');
         }
    };


    const addLog = async () => {
        if (selectedSkill.trim() === '' || hours === '' || !currentUser) return;
        const hoursNum = parseFloat(hours);
        if (isNaN(hoursNum) || hoursNum <= 0) {
            alert('Please enter a valid number of hours.');
            return;
        }

        console.log("Attempting to add skill log with user ID:", currentUser.uid);
        await addDoc(collection(db, 'skillLogs'), {
            skill: selectedSkill,
            hours: hoursNum,
            userId: currentUser.uid,
            timestamp: serverTimestamp(),
        });
        setHours('');
        const q = query(collection(db, 'skillLogs'), where('userId', '==', currentUser.uid), orderBy('timestamp', 'desc'));
        const querySnapshot = await getDocs(q);
        setLogs(querySnapshot.docs.map(doc => { return { id: doc.id, ...doc.data() }; }));
    };

    const updateLog = async (id) => {
        if (editSkillLogSkill.trim() === '' || editSkillLogHours === '' || !currentUser) return;
         const hoursNum = parseFloat(editSkillLogHours);
        if (isNaN(hoursNum) || hoursNum <= 0) {
            alert('Please enter a valid number of hours.');
            return;
        }
        console.log("Attempting to update skill log with user ID:", currentUser.uid);
        const logRef = doc(db, 'skillLogs', id);
        await updateDoc(logRef, { skill: editSkillLogSkill.trim(), hours: hoursNum });
        setEditingLog(null);
        setEditSkillLogSkill('');
        setEditSkillLogHours('');
        const q = query(collection(db, 'skillLogs'), where('userId', '==', currentUser.uid), orderBy('timestamp', 'desc'));
        const querySnapshot = await getDocs(q);
        setLogs(querySnapshot.docs.map(doc => { return { id: doc.id, ...doc.data() }; }));
    };

    const deleteLog = async (id) => {
        if (!currentUser) return;
        console.log("Attempting to delete skill log with user ID:", currentUser.uid);
        await deleteDoc(doc(db, 'skillLogs', id));
        setLogs(logs.filter(log => log.id !== id));
    };

    const totalTimePerSkill = logs.reduce((acc, log) => {
        acc[log.skill] = (acc[log.skill] || 0) + log.hours;
        return acc;
    }, {});

     // Static Smart Suggestions Functionality
    const generateSkillSuggestions = () => {
        const skillsLogged = Object.keys(totalTimePerSkill).length;
        const totalHoursLogged = Object.values(totalTimePerSkill).reduce((sum, hours) => sum + hours, 0);

        let suggestions = `**Skill Hours Summary:**\n\n`;
        suggestions += `- You are currently tracking **${skillsLogged}** skills.\n`;
        suggestions += `- You have logged a total of **${totalHoursLogged.toFixed(1)}** hours across all skills.\n\n`;

        suggestions += `**Suggestions:**\n`;
        if (skillsLogged > 0) {
            // Find the skill with the most hours
            const mostPracticedSkill = Object.entries(totalTimePerSkill).reduce((most, [skill, hours]) => {
                return hours > most.hours ? { skill, hours } : most;
            }, { skill: 'N/A', hours: -1 });
            if (mostPracticedSkill.skill !== 'N/A') {
                 suggestions += `- Your most practiced skill is "**${mostPracticedSkill.skill}**" with **${mostPracticedSkill.hours.toFixed(1)}** hours.\n`;
            }

            // Find skills with less than a certain number of hours (e.g., 10 hours)
            const lessPracticedSkills = Object.entries(totalTimePerSkill).filter(([skill, hours]) => hours < 10);
            if (lessPracticedSkills.length > 0) {
                 suggestions += `- Consider dedicating more time to less practiced skills like ${lessPracticedSkills.map(([skill, hours]) => `"${skill}" (${hours.toFixed(1)} hrs)`).join(', ')}.\n`;
            }

             // Find skills with no recent logs (e.g., last 30 days) - Requires filtering logs by timestamp
             const thirtyDaysAgo = Timestamp.now().toDate();
             thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
             const recentLogs = logs.filter(log => log.timestamp?.toDate() >= thirtyDaysAgo);
             const recentSkills = new Set(recentLogs.map(log => log.skill));
             const inactiveSkills = skills.filter(skill => !recentSkills.has(skill.skillName));

             if (inactiveSkills.length > 0) {
                  suggestions += `- You haven't logged hours for skills like ${inactiveSkills.map(skill => `"${skill.skillName}"`).join(', ')} recently. Try to incorporate them back into your practice.\n`;
             }


             suggestions += `- Review your roadmap goals and ensure your logged skills align with the skills you need to develop.\n`;
        } else {
            suggestions += `- You haven't logged any skill hours yet. Add some skills and start tracking your progress!\n`;
            suggestions += `- Think about the skills you need to develop to achieve your roadmap goals and add them here.\n`;
        }


        setSuggestionsText(suggestions);
        setShowSuggestions(true); // Always show suggestions after generating
        console.log("Generating static skill suggestions...");
    };


    return (
        <div id="skillLog" className="p-6 bg-white dark:bg-gray-800 rounded-xl shadow-md mb-6 transition-colors duration-200"> {/* Added dark mode */}
            <h3 className="text-2xl font-bold mb-6 text-gray-800 dark:text-gray-100 flex items-center"><Clock className="mr-3 text-blue-600 dark:text-blue-400" size={28} /> Skill Hours Log</h3> {/* Added dark mode */}

             {/* Smart Skill Development Suggestions Section */}
             <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900 rounded-lg border border-blue-200 dark:border-blue-700 transition-colors duration-200"> {/* Added dark mode */}
                 <h4 className="text-lg font-semibold text-blue-800 dark:text-blue-300 mb-2 flex items-center"><Lightbulb size={20} className="mr-2"/> Smart Skill Suggestions</h4> {/* Updated heading and icon, dark mode */}
                 <p className="text-blue-700 dark:text-blue-200 text-sm mb-3">Get smart suggestions for skill development based on your goals and logged hours.</p> {/* Updated description, dark mode */}
                 <button
                     className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200 transform hover:scale-105 flex items-center justify-center"
                     onClick={generateSkillSuggestions} // Call the static suggestion function
                 >
                     {showSuggestions ? 'Refresh Suggestions' : 'Get Suggestions'} {/* Change button text */}
                 </button>
                 {showSuggestions && (
                     <div className="mt-4 p-3 bg-blue-100 dark:bg-blue-800 rounded-lg border border-blue-300 dark:border-blue-600 text-blue-900 dark:text-blue-100 whitespace-pre-wrap transition-colors duration-200"> {/* Added dark mode */}
                         <ReactMarkdown>{suggestionsText}</ReactMarkdown> {/* Use ReactMarkdown */}
                          <button
                            className="mt-3 text-blue-700 hover:text-blue-900 text-sm font-semibold flex items-center dark:text-blue-300 dark:hover:text-blue-100" // Dark mode
                            onClick={() => setShowSuggestions(false)} // Hide suggestions
                        >
                            Hide Suggestions <ChevronUp size={16} className="ml-1"/>
                        </button>
                     </div>
                 )}
             </div>


             {/* Action Buttons */}
            <div className="mb-6 flex flex-wrap gap-4">
                 <button
                    className="bg-gray-800 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-transparent transition duration-200 transform hover:scale-105 flex items-center justify-center dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-gray-200" // Minimal button style, dark mode
                    onClick={() => setShowAddSkillModal(true)} // Open modal
                >
                    <Plus size={16} className="mr-1"/> Add New Skill
                </button>
                 <button
                    className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-2 px-4 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-400 focus:border-transparent transition duration-200 transform hover:scale-105 flex items-center justify-center dark:bg-gray-600 dark:hover:bg-gray-500 dark:text-gray-200" // Minimal button style, added dark mode
                    onClick={() => setShowManageSkills(!showManageSkills)} // Toggle manage skills section
                >
                    <Settings size={16} className="mr-1"/> {showManageSkills ? 'Hide Manage Skills' : 'Manage Skills'}
                </button>
            </div>


             {/* Add New Skill Modal */}
            {showAddSkillModal && (
                <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full flex items-center justify-center z-50">
                    <div className="relative p-8 border w-full max-w-md md:max-w-lg lg:max-w-xl shadow-lg rounded-xl bg-white dark:bg-gray-800 transition-colors duration-200"> {/* Dark mode */}
                        <h4 className="text-xl font-semibold mb-4 text-gray-800 dark:text-gray-100">Add New Skill</h4> {/* Dark mode */}
                        <div className="mb-4">
                            <label className="block text-gray-700 dark:text-gray-300 text-sm font-semibold mb-2" htmlFor="newSkillModal"> {/* Dark mode */}
                                Skill Name
                            </label>
                            <input
                                type="text"
                                className="shadow-sm appearance-none border border-gray-300 dark:border-gray-600 rounded-lg w-full py-3 px-4 text-gray-700 dark:text-gray-200 leading-tight focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition duration-200 bg-white dark:bg-gray-700" // Dark mode
                                id="newSkillModal"
                                placeholder="Enter new skill name"
                                value={newSkillName}
                                onChange={(e) => setNewSkillName(e.target.value)}
                            />
                        </div>
                        <div className="flex justify-end gap-4">
                             <button
                                className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-2 px-4 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-400 focus:border-transparent transition duration-200 transform hover:scale-105 dark:bg-gray-600 dark:hover:bg-gray-500 dark:text-gray-200" // Minimal button style, dark mode
                                onClick={() => { setShowAddSkillModal(false); setNewSkillName(''); }} // Close modal and clear input
                            >
                                Cancel
                            </button>
                            <button
                                className="bg-gray-800 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-transparent transition duration-200 transform hover:scale-105 dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-gray-200" // Minimal button style, dark mode
                                onClick={addNewSkill}
                            >
                                Add Skill
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Manage Skills Section (Conditionally Rendered) */}
            {showManageSkills && (
                 <div className="mb-8 p-6 bg-gray-50 dark:bg-gray-700 rounded-lg shadow-sm border border-gray-200 dark:border-gray-600 transition-all duration-300 ease-in-out"> {/* Dark mode */}
                    <h4 className="text-xl font-semibold mb-4 text-gray-800 dark:text-gray-100">Manage Skills</h4> {/* Dark mode */}
                    <ul>
                        {skills.map(skill => (
                            <li key={skill.id} className="bg-white dark:bg-gray-800 p-4 rounded-lg mb-3 flex flex-col sm:flex-row justify-between items-start sm:items-center border border-gray-200 dark:border-gray-600 shadow-sm transition-colors duration-200"> {/* Dark mode */}
                                {editingSkill === skill.id ? (
                                    <input
                                        type="text"
                                        className="shadow-sm appearance-none border border-gray-300 dark:border-gray-600 rounded-lg py-2 px-3 text-gray-700 dark:text-gray-200 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200 mr-2 flex-grow w-full sm:w-auto mb-2 sm:mb-0 bg-white dark:bg-gray-700" // Dark mode
                                        value={editSkillName}
                                        onChange={(e) => setEditSkillName(e.target.value)}
                                    />
                                ) : (
                                    <span className="flex-grow text-gray-800 dark:text-gray-100 text-lg mr-2 mb-2 sm:mb-0">{skill.skillName}</span> // Dark mode
                                )}
                                <div className="flex gap-2 flex-shrink-0">
                                    {editingSkill === skill.id ? (
                                        <button
                                            className="bg-gray-800 hover:bg-gray-700 text-white text-sm py-2 px-4 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-transparent transition duration-200 transform hover:scale-105 flex items-center justify-center dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-gray-200" // Minimal button style, dark mode
                                            onClick={() => updateSkillName(skill.id)}
                                        >
                                            <Save size={16} className="mr-1 sm:mr-1"/> <span className="hidden sm:inline">Save</span> {/* Hide text on small screens */}
                                        </button>
                                    ) : (
                                        <button
                                            className="bg-gray-200 hover:bg-gray-300 text-gray-800 text-sm py-2 px-4 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-400 focus:border-transparent transition duration-200 transform hover:scale-105 flex items-center justify-center dark:bg-gray-600 dark:hover:bg-gray-500 dark:text-gray-200" // Minimal button style, dark mode
                                            onClick={() => { setEditingSkill(skill.id); setEditSkillName(skill.skillName); }}
                                        >
                                            <Edit size={16} className="mr-1 sm:mr-1"/> <span className="hidden sm:inline">Edit</span> {/* Hide text on small screens */}
                                        </button>
                                    )}
                                     <button
                                        className="bg-red-600 hover:bg-red-700 text-white text-sm py-2 px-4 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition duration-200 transform hover:scale-105 flex items-center justify-center" // Destructive action color
                                        onClick={() => deleteSkill(skill.id)}
                                    >
                                        <Trash2 size={16} className="mr-1 sm:mr-1"/> <span className="hidden sm:inline">Delete</span> {/* Hide text on small screens */}
                                    </button>
                                </div>
                            </li>
                        ))}
                         {skills.length === 0 && (
                             <li className="text-gray-600 dark:text-gray-400 text-center py-4">No skills added yet. Add a new skill above!</li> // Dark mode
                         )}
                    </ul>
                 </div>
            )}


            {/* Log Skill Time */}
            <div className="mb-8 p-6 bg-gray-50 dark:bg-gray-700 rounded-lg shadow-sm border border-gray-200 dark:border-gray-600 transition-colors duration-200"> {/* Dark mode */}
                <h4 className="text-xl font-semibold mb-4 text-gray-800 dark:text-gray-100">Log Time for Existing Skill</h4> {/* Dark mode */}
                <div className="flex flex-col sm:flex-row gap-4 items-end"> {/* Aligned items to bottom */}
                    <div className="flex-grow w-full"> {/* Ensured select takes full width on small screens */}
                         <label className="block text-gray-700 dark:text-gray-300 text-sm font-semibold mb-2" htmlFor="selectSkill"> {/* Dark mode */}
                            Select Skill
                        </label>
                        <select
                            className="shadow-sm appearance-none border border-gray-300 dark:border-gray-600 rounded-lg w-full py-3 px-4 text-gray-700 dark:text-gray-200 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200 bg-white dark:bg-gray-700" // Dark mode
                            value={selectedSkill}
                            onChange={(e) => setSelectedSkill(e.target.value)}
                            disabled={skills.length === 0}
                        >
                            {skills.length === 0 ? (
                                <option value="">Add a skill first</option>
                            ) : (
                                skills.map(skill => (
                                    <option key={skill.id} value={skill.skillName}>{skill.skillName}</option>
                                ))
                            )}
                        </select>
                    </div>
                    <div className="w-full sm:w-auto"> {/* Ensured input takes full width on small screens */}
                        <label className="block text-gray-700 dark:text-gray-300 text-sm font-semibold mb-2" htmlFor="hours"> {/* Dark mode */}
                            Hours
                        </label>
                        <input
                            type="number"
                            className="shadow-sm appearance-none border border-gray-300 dark:border-gray-600 rounded-lg w-full py-3 px-4 text-gray-700 dark:text-gray-200 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200 bg-white dark:bg-gray-700" // Dark mode
                            placeholder="Hours"
                            value={hours}
                            onChange={(e) => setHours(e.target.value)}
                            min="0.1"
                            step="0.1"
                            disabled={skills.length === 0}
                        />
                    </div>
                    <button
                        className={`font-bold py-3 px-6 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200 transform hover:scale-105 self-end flex-shrink-0 flex items-center justify-center w-full sm:w-auto ${skills.length === 0 ? 'bg-gray-400 cursor-not-allowed text-gray-700 dark:bg-gray-600 dark:text-gray-400' : 'bg-gray-800 hover:bg-gray-700 text-white dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-gray-200'}`} // Minimal button style and refined disabled state, dark mode
                        onClick={addLog}
                        disabled={skills.length === 0}
                    >
                        <Plus className="mr-2" size={20} /> Log Time
                    </button>
                </div>
            </div>

            {/* Total Time per Skill */}
            <div className="mb-8 p-6 bg-gray-50 dark:bg-gray-700 rounded-lg shadow-sm border border-gray-200 dark:border-gray-600 transition-colors duration-200"> {/* Dark mode */}
                 <h4 className="text-xl font-semibold mb-4 text-gray-800 dark:text-gray-100 flex items-center"><BarChart2 className="mr-2 text-blue-600 dark:text-blue-400" size={24} /> Total Time per Skill</h4> {/* Dark mode */}
                <ul>
                    {Object.entries(totalTimePerSkill).map(([skill, totalHours]) => (
                        <li key={skill} className="mb-2 text-gray-700 dark:text-gray-200 text-lg border-b border-gray-200 dark:border-gray-600 pb-2 last:border-b-0"> {/* Dark mode */}
                            <strong className="text-gray-800 dark:text-gray-100">{skill}:</strong> {totalHours.toFixed(1)} hours {/* Dark mode */}
                        </li>
                    ))}
                </ul>
            </div>


            {/* Log History */}
            <div className="p-6 bg-gray-50 dark:bg-gray-700 rounded-lg shadow-sm border border-gray-200 dark:border-gray-600 transition-colors duration-200"> {/* Dark mode */}
                <h4 className="text-xl font-semibold mb-4 text-gray-800 dark:text-gray-100 flex items-center"><Briefcase className="mr-2 text-blue-600 dark:text-blue-400" size={24} /> Log History</h4> {/* Dark mode */}
                 <ul>
                    {logs.map(log => (
                        <li key={log.id} className="bg-white dark:bg-gray-800 p-4 rounded-lg mb-3 flex flex-col sm:flex-row justify-between items-start sm:items-center border border-gray-200 dark:border-gray-600 shadow-sm transition-colors duration-200"> {/* Dark mode */}
                             {editingLog === log.id ? (
                                <div className="flex-grow flex flex-col sm:flex-row gap-3 mr-2 w-full sm:w-auto mb-2 sm:mb-0">
                                    <input
                                        type="text"
                                        className="shadow-sm appearance-none border border-gray-300 dark:border-gray-600 rounded-lg py-2 px-3 text-gray-700 dark:text-gray-200 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200 flex-grow bg-white dark:bg-gray-700" // Dark mode
                                        value={editSkillLogSkill}
                                        onChange={(e) => setEditSkillLogSkill(e.target.value)}
                                        placeholder="Skill"
                                    />
                                     <input
                                        type="number"
                                        className="shadow-sm appearance-none border border-gray-300 dark:border-gray-600 rounded-lg py-2 px-3 text-gray-700 dark:text-gray-200 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200 w-full sm:w-20 bg-white dark:bg-gray-700" // Dark mode
                                        value={editSkillLogHours}
                                        onChange={(e) => setEditSkillLogHours(e.target.value)}
                                        min="0.1"
                                        step="0.1"
                                        placeholder="Hours"
                                    />
                                </div>
                             ) : (
                                <span className="flex-grow text-gray-800 dark:text-gray-100 text-lg mr-2 mb-2 sm:mb-0"> {/* Dark mode */}
                                    <strong className="text-gray-900 dark:text-gray-50">{log.skill}:</strong> {log.hours} hours - <span className="text-sm text-gray-600 dark:text-gray-400">{log.timestamp?.toDate().toLocaleString()}</span> {/* Dark mode */}
                                </span>
                            )}
                            <div className="flex gap-2 flex-shrink-0">
                                {editingLog === log.id ? (
                                    <button
                                        className="bg-gray-800 hover:bg-gray-700 text-white text-sm py-2 px-4 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-transparent transition duration-200 transform hover:scale-105 flex items-center justify-center dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-gray-200" // Minimal button style, dark mode
                                        onClick={() => updateLog(log.id)}
                                    >
                                        <Save size={16} className="mr-1 sm:mr-1"/> <span className="hidden sm:inline">Save</span> {/* Hide text on small screens */}
                                    </button>
                                ) : (
                                    <button
                                        className="bg-gray-200 hover:bg-gray-300 text-gray-800 text-sm py-2 px-4 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-400 focus:border-transparent transition duration-200 transform hover:scale-105 flex items-center justify-center dark:bg-gray-600 dark:hover:bg-gray-500 dark:text-gray-200" // Minimal button style, dark mode
                                        onClick={() => { setEditingLog(log.id); setEditSkillLogSkill(log.skill); setEditSkillLogHours(log.hours.toString()); }}
                                    >
                                        <Edit size={16} className="mr-1 sm:mr-1"/> <span className="hidden sm:inline">Edit</span> {/* Hide text on small screens */}
                                    </button>
                                )}
                                <button
                                    className="bg-red-600 hover:bg-red-700 text-white text-sm py-2 px-4 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition duration-200 transform hover:scale-105 flex items-center justify-center" // Destructive action color
                                    onClick={() => deleteLog(log.id)}
                                >
                                    <Trash2 size={16} className="mr-1 sm:mr-1"/> <span className="hidden sm:inline">Delete</span> {/* Hide text on small screens */}
                                </button>
                            </div>
                        </li>
                    ))}
                </ul>
            </div>
        </div>
    );
};


const PersonalBrandFeed = () => {
     const { currentUser } = useAuth();
    const [feedItems, setFeedItems] = useState([]);
    const [newItem, setNewItem] = useState('');
    const [editingItem, setEditingItem] = useState(null);
    const [editText, setEditText] = useState('');
    const [showSuggestions, setShowSuggestions] = useState(false); // State to toggle suggestions visibility
    const [suggestionsText, setSuggestionsText] = useState(''); // State to hold suggestions


    useEffect(() => {
        const fetchFeed = async () => {
            if (!currentUser) {
                console.log("PersonalBrandFeed: No user logged in, skipping fetch.");
                return;
            }
            const q = query(collection(db, 'brandFeed'), where('userId', '==', currentUser.uid), orderBy('createdAt', 'desc'));
            const querySnapshot = await getDocs(q);
            setFeedItems(querySnapshot.docs.map(doc => { return { id: doc.id, ...doc.data() }; }));
        };
        fetchFeed();
    }, [currentUser]);

    const addItem = async () => {
        if (newItem.trim() === '' || !currentUser) return;
        console.log("Attempting to add brand feed item with user ID:", currentUser.uid);
        await addDoc(collection(db, 'brandFeed'), {
            text: newItem.trim(),
            userId: currentUser.uid,
            createdAt: serverTimestamp(),
        });
        setNewItem('');
        const q = query(collection(db, 'brandFeed'), where('userId', '==', currentUser.uid), orderBy('createdAt', 'desc'));
        const querySnapshot = await getDocs(q);
        setFeedItems(querySnapshot.docs.map(doc => { return { id: doc.id, ...doc.data() }; }));
    };

    const updateItem = async (id) => {
        if (editText.trim() === '' || !currentUser) return;
        console.log("Attempting to update brand feed item with user ID:", currentUser.uid);
        const itemRef = doc(db, 'brandFeed', id);
        await updateDoc(itemRef, { text: editText.trim() });
        setEditingItem(null);
        setEditText('');
        const q = query(collection(db, 'brandFeed'), where('userId', '==', currentUser.uid), orderBy('createdAt', 'desc'));
        const querySnapshot = await getDocs(q);
        setFeedItems(querySnapshot.docs.map(doc => { return { id: doc.id, ...doc.data() }; }));
    };

    const deleteItem = async (id) => {
        if (!currentUser) return;
        console.log("Attempting to delete brand feed item with user ID:", currentUser.uid);
        await deleteDoc(doc(db, 'brandFeed', id));
        setFeedItems(feedItems.filter(item => item.id !== id));
    };

     // Static Smart Suggestions Functionality
    const generateContentSuggestions = () => {
        const totalItems = feedItems.length;
        const latestItem = feedItems.length > 0 ? feedItems[0] : null;


        let suggestions = `**Personal Brand Feed Summary:**\n\n`;
        suggestions += `- You have **${totalItems}** entries in your feed.\n`;
        if (latestItem) {
             suggestions += `- Your most recent entry is: "${latestItem.text}" (added ${latestItem.createdAt?.toDate().toLocaleDateString()}).\n\n`;
        } else {
             suggestions += `- Your personal brand feed is currently empty.\n\n`;
        }


        suggestions += `**Suggestions:**\n`;
        if (totalItems > 0) {
            suggestions += `- Review your recent entries and identify common themes or topics you can expand on.\n`;
            suggestions += `- Consider sharing your progress on a specific skill or roadmap goal in your feed.\n`;
            suggestions += `- Think about what kind of content would be valuable to your professional network.\n`;
        } else {
            suggestions += `- Use this space to track ideas for social media posts, articles, or networking topics.\n`;
            suggestions += `- Start by adding a note about a recent accomplishment or a topic you're learning about.\n`;
        }

        setSuggestionsText(suggestions);
        setShowSuggestions(true); // Always show suggestions after generating
        console.log("Generating static content suggestions...");
    };


    return (
        <div id="brandFeed" className="p-6 bg-white dark:bg-gray-800 rounded-xl shadow-md mb-6 transition-colors duration-200"> {/* Added dark mode */}
            <h3 className="text-2xl font-bold mb-6 text-gray-800 dark:text-gray-100 flex items-center"><Feather className="mr-3 text-blue-600 dark:text-blue-400" size={28} /> Personal Brand Feed</h3> {/* Added dark mode */}

             {/* Smart Content Suggestions Section */}
             <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900 rounded-lg border border-blue-200 dark:border-blue-700 transition-colors duration-200"> {/* Added dark mode */}
                 <h4 className="text-lg font-semibold text-blue-800 dark:text-blue-300 mb-2 flex items-center"><Lightbulb size={20} className="mr-2"/> Smart Content Suggestions</h4> {/* Updated heading and icon, dark mode */}
                 <p className="text-blue-700 dark:text-blue-200 text-sm mb-3">Get smart content ideas and suggestions to help you build your personal brand.</p> {/* Updated description, dark mode */}
                 <button
                     className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200 transform hover:scale-105 flex items-center justify-center"
                     onClick={generateContentSuggestions} // Call the static suggestion function
                 >
                     {showSuggestions ? 'Refresh Suggestions' : 'Get Suggestions'} {/* Change button text */}
                 </button>
                 {showSuggestions && (
                     <div className="mt-4 p-3 bg-blue-100 dark:bg-blue-800 rounded-lg border border-blue-300 dark:border-blue-600 text-blue-900 dark:text-blue-100 whitespace-pre-wrap transition-colors duration-200"> {/* Added dark mode */}
                         <ReactMarkdown>{suggestionsText}</ReactMarkdown> {/* Use ReactMarkdown */}
                          <button
                            className="mt-3 text-blue-700 hover:text-blue-900 text-sm font-semibold flex items-center dark:text-blue-300 dark:hover:text-blue-100" // Dark mode
                            onClick={() => setShowSuggestions(false)} // Hide suggestions
                        >
                            Hide Suggestions <ChevronUp size={16} className="ml-1"/>
                        </button>
                     </div>
                 )}
             </div>

            <div className="mb-6 flex flex-col sm:flex-row gap-3">
                <input
                    type="text"
                    className="shadow-sm appearance-none border border-gray-300 dark:border-gray-600 rounded-lg w-full py-3 px-4 text-gray-700 dark:text-gray-200 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200 bg-white dark:bg-gray-700" // Dark mode
                    placeholder="Add a personal brand note or idea"
                    value={newItem}
                    onChange={(e) => setNewItem(e.target.value)}
                />
                 <button
                  className="bg-gray-800 hover:bg-gray-700 text-white font-bold py-3 px-6 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-transparent transition duration-200 transform hover:scale-105 flex-shrink-0 flex items-center justify-center dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-gray-200" // Minimal button style, dark mode
                  onClick={addItem}
                >
                  <Plus className="mr-2" size={20} /> Add
                </button>
            </div>
             <ul>
                {feedItems.map(item => (
                    <li key={item.id} className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg mb-3 flex flex-col sm:flex-row justify-between items-start sm:items-center border border-gray-200 dark:border-gray-600 shadow-sm transition-colors duration-200"> {/* Dark mode */}
                         {editingItem === item.id ? (
                            <input
                                type="text"
                                className="shadow-sm appearance-none border border-gray-300 dark:border-gray-600 rounded-lg py-2 px-3 text-gray-700 dark:text-gray-200 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200 mr-2 flex-grow w-full sm:w-auto mb-2 sm:mb-0 bg-white dark:bg-gray-800" // Dark mode
                                value={editText}
                                onChange={(e) => setEditText(e.target.value)}
                            />
                        ) : (
                            <span className="flex-grow text-gray-800 dark:text-gray-100 text-lg mr-2 mb-2 sm:mb-0">{item.text}</span> // Dark mode
                        )}
                        <div className="flex gap-2 flex-shrink-0">
                             {editingItem === item.id ? (
                                <button
                                    className="bg-gray-800 hover:bg-gray-700 text-white text-sm py-2 px-4 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-transparent transition duration-200 transform hover:scale-105 flex items-center justify-center dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-gray-200" // Minimal button style, dark mode
                                    onClick={() => updateItem(item.id)}
                                >
                                    <Save size={16} className="mr-1 sm:mr-1"/> <span className="hidden sm:inline">Save</span> {/* Hide text on small screens */}
                                </button>
                            ) : (
                                <button
                                    className="bg-gray-200 hover:bg-gray-300 text-gray-800 text-sm py-2 px-4 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-400 focus:border-transparent transition duration-200 transform hover:scale-105 flex items-center justify-center dark:bg-gray-600 dark:hover:bg-gray-500 dark:text-gray-200" // Minimal button style, dark mode
                                    onClick={() => { setEditingItem(item.id); setEditText(item.text); }}
                                >
                                    <Edit size={16} className="mr-1 sm:mr-1"/> <span className="hidden sm:inline">Edit</span> {/* Hide text on small screens */}
                                </button>
                            )}
                            <button
                                className="bg-red-600 hover:bg-red-700 text-white text-sm py-2 px-4 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition duration-200 transform hover:scale-105 flex items-center justify-center" // Destructive action color
                                onClick={() => deleteItem(item.id)}
                              >
                                <Trash2 size={16} className="mr-1 sm:mr-1"/> <span className="hidden sm:inline">Delete</span> {/* Hide text on small screens */}
                              </button>
                        </div>
                    </li>
                ))}
            </ul>
        </div>
    );
};

const MVPTestLauncher = () => {
    return (
        <div id="mvpTestLauncher" className="p-6 bg-white dark:bg-gray-800 rounded-xl shadow-md mb-6 transition-colors duration-200"> {/* Added dark mode */}
            <h3 className="text-2xl font-bold mb-6 text-gray-800 dark:text-gray-100">MVP Test Launcher</h3> {/* Dark mode */}
            <p className="text-gray-700 dark:text-gray-200 text-lg">This section is for launching MVP tests. Implementation details would depend on the nature of the tests.</p> {/* Dark mode */}
        </div>
    );
};

const Finance = () => {
     const { currentUser } = useAuth();
    const [transactions, setTransactions] = useState([]);
    const [description, setDescription] = useState('');
    const [amount, setAmount] = useState('');
    const [type, setType] = useState('expense');
    const [editingTransaction, setEditingTransaction] = useState(null);
    const [editDescription, setEditDescription] = useState('');
    const [editAmount, setEditAmount] = useState('');
    const [editType, setEditType] = useState('');
    const [showSuggestions, setShowSuggestions] = useState(false); // State to toggle suggestions visibility
    const [suggestionsText, setSuggestionsText] = useState(''); // State to hold suggestions


    useEffect(() => {
        const fetchTransactions = async () => {
            if (!currentUser) {
                console.log("Finance: No user logged in, skipping fetch.");
                return;
            }
            const q = query(collection(db, 'finance'), where('userId', '==', currentUser.uid), orderBy('timestamp', 'desc'));
            const querySnapshot = await getDocs(q);
            setTransactions(querySnapshot.docs.map(doc => { return { id: doc.id, ...doc.data() }; }));
        };
        fetchTransactions();
    }, [currentUser]);

    const addTransaction = async () => {
        if (description.trim() === '' || amount === '' || !currentUser) return;
        const amountNum = parseFloat(amount);
         if (isNaN(amountNum) || amountNum <= 0) {
            alert('Please enter a valid amount.');
            return;
        }
        console.log("Attempting to add finance transaction with user ID:", currentUser.uid);
        await addDoc(collection(db, 'finance'), {
            description: description.trim(),
            amount: amountNum,
            type: type,
            userId: currentUser.uid,
            timestamp: serverTimestamp(),
        });
        setDescription('');
        setAmount('');
        setType('expense');
         const q = query(collection(db, 'finance'), where('userId', '==', currentUser.uid), orderBy('timestamp', 'desc'));
        const querySnapshot = await getDocs(q);
        setTransactions(querySnapshot.docs.map(doc => { return { id: doc.id, ...doc.data() }; }));
    };

    const updateTransaction = async (id) => {
         if (editDescription.trim() === '' || editAmount === '' || editType.trim() === '' || !currentUser) return;
         const amountNum = parseFloat(editAmount);
         if (isNaN(amountNum) || amountNum <= 0) {
            alert('Please enter a valid amount.');
            return;
        }
        console.log("Attempting to update finance transaction with user ID:", currentUser.uid);
        const transactionRef = doc(db, 'finance', id);
        await updateDoc(transactionRef, { description: editDescription.trim(), amount: amountNum, type: editType });
        setEditingTransaction(null);
        setEditDescription('');
        setEditAmount('');
        setEditType('');
         const q = query(collection(db, 'finance'), where('userId', '==', currentUser.uid), orderBy('timestamp', 'desc'));
        const querySnapshot = await getDocs(q);
        setTransactions(querySnapshot.docs.map(doc => { return { id: doc.id, ...doc.data() }; }));
    };

    const deleteTransaction = async (id) => {
        if (!currentUser) return;
        console.log("Attempting to delete finance transaction with user ID:", currentUser.uid);
        await deleteDoc(doc(db, 'finance', id));
        setTransactions(transactions.filter(transaction => transaction.id !== id));
    };

    const totalIncome = transactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
    const totalExpense = transactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
    const netBalance = totalIncome - totalExpense;

     // Static Smart Suggestions Functionality
    const generateFinancialSuggestions = () => {
        const totalTransactions = transactions.length;
        const highestExpense = transactions.filter(t => t.type === 'expense').reduce((max, t) => Math.max(max, t.amount), 0);
        const highestIncome = transactions.filter(t => t.type === 'income').reduce((max, t) => Math.max(max, t.amount), 0);


        let suggestions = `**Financial Summary:**\n\n`;
        suggestions += `- You have recorded **${totalTransactions}** transactions.\n`;
        suggestions += `- Your total income is **$${totalIncome.toFixed(2)}**.\n`;
        suggestions += `- Your total expense is **$${totalExpense.toFixed(2)}**.\n`;
        suggestions += `- Your current net balance is **$${netBalance.toFixed(2)}**.\n\n`;

        suggestions += `**Suggestions:**\n`;
        if (netBalance < 0) {
            suggestions += `- Your expenses currently exceed your income. Review your recent transactions to identify areas where you can reduce spending.\n`;
            suggestions += `- Consider setting a budget for different expense categories.\n`;
        } else if (netBalance > 0) {
            suggestions += `- Your income exceeds your expenses. Consider setting a savings goal or investing.\n`;
            suggestions += `- Review your income sources and explore ways to increase them.\n`;
        } else {
             suggestions += `- Your income and expenses are balanced. Ensure this aligns with your long-term financial goals.\n`;
        }

        if (highestExpense > 0) {
             suggestions += `- Your highest single expense recorded is **$${highestExpense.toFixed(2)}**.\n`;
        }
         if (highestIncome > 0) {
             suggestions += `- Your highest single income recorded is **$${highestIncome.toFixed(2)}**.\n`;
        }

        // Simple check for high expenses relative to income
        if (totalIncome > 0 && totalExpense / totalIncome > 0.8) { // If expenses are more than 80% of income
             suggestions += `- Your expenses are relatively high compared to your income. Look for opportunities to reduce spending or increase income.\n`;
        }

         if (totalTransactions === 0) {
             suggestions = `**Financial Summary:**\n\n- You haven't added any financial transactions yet.\n\n**Suggestions:**\n- Start by logging your income and expenses to get a clear picture of your finances.\n- Tracking your spending is the first step to better financial management.\n`;
         }


        setSuggestionsText(suggestions);
        setShowSuggestions(true); // Always show suggestions after generating
        console.log("Generating static financial suggestions...");
    };


    return (
        <div id="finance" className="p-6 bg-white dark:bg-gray-800 rounded-xl shadow-md mb-6 transition-colors duration-200"> {/* Added dark mode */}
            <h3 className="text-2xl font-bold mb-6 text-gray-800 dark:text-gray-100 flex items-center"><DollarSign className="mr-3 text-green-600 dark:text-green-400" size={28} /> Income/Expense</h3> {/* Added dark mode */}

             {/* Smart Financial Insights Section */}
             <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900 rounded-lg border border-blue-200 dark:border-blue-700 transition-colors duration-200"> {/* Added dark mode */}
                 <h4 className="text-lg font-semibold text-blue-800 dark:text-blue-300 mb-2 flex items-center"><Lightbulb size={20} className="mr-2"/> Smart Financial Insights</h4> {/* Updated heading and icon, dark mode */}
                 <p className="text-blue-700 dark:text-blue-200 text-sm mb-3">Get smart insights and tips to help you manage your finances effectively.</p> {/* Updated description, dark mode */}
                 <button
                     className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200 transform hover:scale-105 flex items-center justify-center"
                     onClick={generateFinancialSuggestions} // Call the static suggestion function
                 >
                     {showSuggestions ? 'Refresh Insights' : 'Get Insights'} {/* Change button text */}
                 </button>
                 {showSuggestions && (
                     <div className="mt-4 p-3 bg-blue-100 dark:bg-blue-800 rounded-lg border border-blue-300 dark:border-blue-600 text-blue-900 dark:text-blue-100 whitespace-pre-wrap transition-colors duration-200"> {/* Added dark mode */}
                         <ReactMarkdown>{suggestionsText}</ReactMarkdown> {/* Use ReactMarkdown */}
                          <button
                            className="mt-3 text-blue-700 hover:text-blue-900 text-sm font-semibold flex items-center dark:text-blue-300 dark:hover:text-blue-100" // Dark mode
                            onClick={() => setShowSuggestions(false)} // Hide suggestions
                        >
                            Hide Suggestions <ChevronUp size={16} className="ml-1"/>
                        </button>
                     </div>
                 )}
             </div>


            <div className="mb-8 p-6 bg-gray-50 dark:bg-gray-700 rounded-lg shadow-sm border border-gray-200 dark:border-gray-600 transition-colors duration-200"> {/* Dark mode */}
                <h4 className="text-xl font-semibold mb-4 text-gray-800 dark:text-gray-100">Add Transaction</h4> {/* Dark mode */}
                 <div className="flex flex-col sm:flex-row gap-4">
                    <div className="flex-grow">
                        <label className="block text-gray-700 dark:text-gray-300 text-sm font-semibold mb-2" htmlFor="description"> {/* Dark mode */}
                            Description
                        </label>
                        <input
                            type="text"
                            className="shadow-sm appearance-none border border-gray-300 dark:border-gray-600 rounded-lg w-full py-3 px-4 text-gray-700 dark:text-gray-200 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200 bg-white dark:bg-gray-700" // Dark mode
                            placeholder="Description"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                        />
                    </div>
                    <div>
                        <label className="block text-gray-700 dark:text-gray-300 text-sm font-semibold mb-2" htmlFor="amount"> {/* Dark mode */}
                            Amount
                        </label>
                        <input
                            type="number"
                            className="shadow-sm appearance-none border border-gray-300 dark:border-gray-600 rounded-lg w-full py-3 px-4 text-gray-700 dark:text-gray-200 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200 bg-white dark:bg-gray-700" // Dark mode
                            placeholder="Amount"
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            min="0.01"
                            step="0.01"
                        />
                    </div>
                    <div>
                         <label className="block text-gray-700 dark:text-gray-300 text-sm font-semibold mb-2" htmlFor="type"> {/* Dark mode */}
                            Type
                        </label>
                        <select
                            className="shadow-sm appearance-none border border-gray-300 dark:border-gray-600 rounded-lg w-full py-3 px-4 text-gray-700 dark:text-gray-200 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200 bg-white dark:bg-gray-700" // Dark mode
                            value={type}
                            onChange={(e) => setType(e.target.value)}
                        >
                            <option value="income">Income</option>
                            <option value="expense">Expense</option>
                        </select>
                    </div>
                     <button
                        className="bg-gray-800 hover:bg-gray-700 text-white font-bold py-3 px-6 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-transparent transition duration-200 transform hover:scale-105 self-end flex-shrink-0 flex items-center justify-center dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-gray-200" // Minimal button style, dark mode
                        onClick={addTransaction}
                    >
                        <Plus className="mr-2" size={20} /> Add Transaction
                    </button>
                </div>
            </div>

            {/* Summary */}
            <div className="mb-8 p-6 bg-gray-50 dark:bg-gray-700 rounded-lg shadow-sm border border-gray-200 dark:border-gray-600 transition-colors duration-200"> {/* Dark mode */}
                 <h4 className="text-xl font-semibold mb-4 text-gray-800 dark:text-gray-100">Summary</h4> {/* Dark mode */}
                <p className="text-gray-700 dark:text-gray-200 text-lg mb-2"> {/* Dark mode */}
                    <strong className="text-emerald-600 dark:text-emerald-400">Total Income:</strong> ${totalIncome.toFixed(2)} {/* Updated color, dark mode */}
                </p>
                <p className="text-gray-700 dark:text-gray-200 text-lg mb-2"> {/* Dark mode */}
                    <strong className="text-red-600 dark:text-red-400">Total Expense:</strong> ${totalExpense.toFixed(2)}
                </p>
                <p className="text-gray-800 dark:text-gray-100 text-xl font-bold"> {/* Dark mode */}
                    Net Balance: ${netBalance.toFixed(2)}
                </p>
            </div>

            {/* Transaction History */}
            <div className="p-6 bg-gray-50 dark:bg-gray-700 rounded-lg shadow-sm border border-gray-200 dark:border-gray-600 transition-colors duration-200"> {/* Dark mode */}
                <h4 className="text-xl font-semibold mb-4 text-gray-800 dark:text-gray-100">Transaction History</h4> {/* Dark mode */}
                 <ul>
                    {transactions.map(transaction => (
                        <li key={transaction.id} className="bg-white dark:bg-gray-800 p-4 rounded-lg mb-3 flex flex-col sm:flex-row justify-between items-start sm:items-center border border-gray-200 dark:border-gray-600 shadow-sm transition-colors duration-200"> {/* Dark mode */}
                             {editingTransaction === transaction.id ? (
                                <div className="flex-grow flex flex-col sm:flex-row gap-3 mr-2 w-full sm:w-auto mb-2 sm:mb-0">
                                    <input
                                        type="text"
                                        className="shadow-sm appearance-none border border-gray-300 dark:border-gray-600 rounded-lg py-2 px-3 text-gray-700 dark:text-gray-200 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200 flex-grow bg-white dark:bg-gray-700" // Dark mode
                                        value={editDescription}
                                        onChange={(e) => setEditDescription(e.target.value)}
                                        placeholder="Description"
                                    />
                                     <input
                                        type="number"
                                        className="shadow-sm appearance-none border border-gray-300 dark:border-gray-600 rounded-lg py-2 px-3 text-gray-700 dark:text-gray-200 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200 w-full sm:w-20 bg-white dark:bg-gray-700" // Dark mode
                                        value={editAmount}
                                        onChange={(e) => setEditAmount(e.target.value)}
                                        min="0.01"
                                        step="0.01"
                                        placeholder="Amount"
                                    />
                                     <select
                                        className="shadow-sm appearance-none border border-gray-300 dark:border-gray-600 rounded-lg w-full py-2 px-3 text-gray-700 dark:text-gray-200 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200 w-full sm:w-24 bg-white dark:bg-gray-700" // Dark mode
                                        value={editType}
                                        onChange={(e) => setEditType(e.target.value)}
                                    >
                                        <option value="income">Income</option>
                                        <option value="expense">Expense</option>
                                    </select>
                                </div>
                             ) : (
                                <span className={`flex-grow text-lg mr-2 mb-2 sm:mb-0 ${transaction.type === 'expense' ? 'text-red-600 dark:text-red-400' : 'text-emerald-600 dark:text-emerald-400'}`}> {/* Updated income text color, dark mode */}
                                    <strong className="text-gray-900 dark:text-gray-50">{transaction.description}:</strong> ${transaction.amount.toFixed(2)} ({transaction.type}) - <span className="text-sm text-gray-600 dark:text-gray-400">{transaction.timestamp?.toDate().toLocaleString()}</span> {/* Dark mode */}
                                </span>
                            )}
                            <div className="flex gap-2 flex-shrink-0">
                                {editingTransaction === transaction.id ? (
                                    <button
                                        className="bg-gray-800 hover:bg-gray-700 text-white text-sm py-2 px-4 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-transparent transition duration-200 transform hover:scale-105 flex items-center justify-center dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-gray-200" // Minimal button style, dark mode
                                        onClick={() => updateTransaction(transaction.id)}
                                    >
                                        <Save size={16} className="mr-1 sm:mr-1"/> <span className="hidden sm:inline">Save</span> {/* Hide text on small screens */}
                                    </button>
                                ) : (
                                    <button
                                        className="bg-gray-200 hover:bg-gray-300 text-gray-800 text-sm py-2 px-4 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-400 focus:border-transparent transition duration-200 transform hover:scale-105 flex items-center justify-center dark:bg-gray-600 dark:hover:bg-gray-500 dark:text-gray-200" // Minimal button style, dark mode
                                        onClick={() => { setEditingTransaction(transaction.id); setEditDescription(transaction.description); setEditAmount(transaction.amount.toString()); setEditType(transaction.type); }}
                                    >
                                        <Edit size={16} className="mr-1 sm:mr-1"/> <span className="hidden sm:inline">Edit</span> {/* Hide text on small screens */}
                                    </button>
                                )}
                                <button
                                    className="bg-red-600 hover:bg-red-700 text-white text-sm py-2 px-4 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition duration-200 transform hover:scale-105 flex items-center justify-center" // Destructive action color
                                    onClick={() => deleteTransaction(transaction.id)}
                                >
                                    <Trash2 size={16} className="mr-1 sm:mr-1"/> <span className="hidden sm:inline">Delete</span> {/* Hide text on small screens */}
                                </button>
                            </div>
                        </li>
                    ))}
                </ul>
            </div>
        </div>
    );
};


const SettingsComponent = ({ onClose }) => {
    // Initialize theme from localStorage or default to 'system'
    const [theme, setTheme] = useState(localStorage.getItem('theme') || 'system');

    // Effect to apply the theme class to the root html element
    useEffect(() => {
        const applyThemeClass = (selectedTheme) => {
            const root = document.documentElement;
            // Remove existing theme classes
            root.classList.remove('light', 'dark');

            if (selectedTheme === 'system') {
                // Apply dark class if system prefers dark
                if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
                    root.classList.add('dark');
                } else {
                    // Apply light class if system prefers light
                    root.classList.add('light');
                }
            } else {
                // Apply the selected theme class directly
                root.classList.add(selectedTheme);
            }
        };

        // Apply theme when the component mounts
        applyThemeClass(theme);

        // Save the selected theme to localStorage
        localStorage.setItem('theme', theme);

        // Listen for system theme changes if theme is set to 'system'
        const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
        const handleSystemThemeChange = () => {
            if (theme === 'system') {
                applyThemeClass('system');
            }
        };
        mediaQuery.addEventListener('change', handleSystemThemeChange);

        // Cleanup listener on component unmount
        return () => {
            mediaQuery.removeEventListener('change', handleSystemThemeChange);
        };

    }, [theme]); // Re-run effect when theme changes


    const handleThemeChange = (newTheme) => {
        setTheme(newTheme);
    };

    return (
        <div className="p-6 bg-white dark:bg-gray-800 rounded-xl shadow-md transition-colors duration-200"> {/* Dark mode */}
            <h3 className="text-2xl font-bold mb-6 text-gray-800 dark:text-gray-100 flex items-center"><Settings size={28} className="mr-3 text-blue-600 dark:text-blue-400" /> Settings</h3> {/* Dark mode */}
            <div className="mb-4">
                <h4 className="text-lg font-semibold mb-2 text-gray-800 dark:text-gray-100">Theme</h4> {/* Dark mode */}
                <div className="flex flex-wrap gap-4"> {/* Added flex-wrap for smaller screens */}
                    <button
                        className={`flex items-center px-4 py-2 rounded-lg transition duration-200 ${theme === 'light' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-800 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-gray-200'}`} // Dark mode colors for inactive state
                        onClick={() => handleThemeChange('light')}
                    >
                        <Sun size={20} className="mr-2"/> Light
                    </button>
                    <button
                        className={`flex items-center px-4 py-2 rounded-lg transition duration-200 ${theme === 'dark' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-800 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-gray-200'}`} // Dark mode colors for inactive state
                        onClick={() => handleThemeChange('dark')}
                    >
                        <Moon size={20} className="mr-2"/> Dark
                    </button>
                    <button
                         className={`flex items-center px-4 py-2 rounded-lg transition duration-200 ${theme === 'system' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-800 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-gray-200'}`} // Dark mode colors for inactive state
                        onClick={() => handleThemeChange('system')}
                    >
                        <Monitor size={20} className="mr-2"/> System
                    </button>
                </div>
            </div>
            {/* Add other settings options here */}
             <button
                className="mt-6 bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-2 px-4 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-400 focus:border-transparent transition duration-200 transform hover:scale-105 dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-gray-200" // Dark mode
                onClick={onClose}
            >
                Close Settings
            </button>
        </div>
    );
};


const Dashboard = () => {
  const { currentUser, logout } = useAuth();
  // Initialize activeTab from localStorage or default to 'roadmap'
  const [activeTab, setActiveTab] = useState(localStorage.getItem('activeTab') || 'roadmap');
  const [isMenuOpen, setIsMenuOpen] = useState(false); // State for hamburger menu
  const [showSettings, setShowSettings] = useState(false); // State to show settings component


  // Ref for the navigation bar container
  const navRef = useRef(null);

  // Effect to save activeTab to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('activeTab', activeTab);
  }, [activeTab]);

  // Effect to scroll the navigation bar to the active tab on mount or when activeTab changes
  useEffect(() => {
    // Use a slight delay to ensure elements are rendered before scrolling
    const timer = setTimeout(() => {
      if (navRef.current) {
        // Find the button element for the active tab within the nav bar
        const activeTabButton = navRef.current.querySelector(`button[data-tab="${activeTab}"]`);
        if (activeTabButton) {
          activeTabButton.scrollIntoView({ behavior: 'smooth', inline: 'center' });
        }
      }
    }, 100); // Adjust delay as needed

    return () => clearTimeout(timer); // Clean up the timer
  }, [activeTab]); // Depend on activeTab

  const handleTabClick = (tab) => {
      setActiveTab(tab);
      setIsMenuOpen(false); // Close menu on tab click
      setShowSettings(false); // Hide settings if open
  }

  const handleSettingsClick = () => {
      setShowSettings(true);
      setIsMenuOpen(false); // Close menu when opening settings
  }

  const handleCloseSettings = () => {
      setShowSettings(false);
  }


  const renderContent = () => {
      if (showSettings) {
          return <SettingsComponent onClose={handleCloseSettings} />;
      }
    switch (activeTab) {
      case 'roadmap':
        return <Roadmap />;
      case 'weeklyActions':
        return <WeeklyActions />;
      case 'dailyHabits':
        return <DailyHabits />;
      case 'skillLog':
        return <SkillHoursLog />;
      case 'brandFeed':
        return <PersonalBrandFeed />;
      case 'mvpTestLauncher':
        return <MVPTestLauncher />;
      case 'finance':
        return <Finance />;
      default:
        return <Roadmap />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 dark:bg-gray-900 text-gray-900 dark:text-gray-100 transition-colors duration-200"> {/* Softened background, added dark mode */}
      <header className="bg-white dark:bg-gray-800 shadow-md py-4 px-6 flex justify-between items-center rounded-xl mb-6 transition-colors duration-200"> {/* Added dark mode */}
        <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100">Mentoro</h1> {/* Added dark mode */}

        {/* Hamburger Menu Button (Visible on small screens) */}
        <button
            className="sm:hidden text-gray-800 dark:text-gray-100 focus:outline-none" // Dark mode for icon color
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            aria-label="Toggle menu"
        >
            {isMenuOpen ? <CloseIcon size={28} /> : <Menu size={28} />}
        </button>


        {/* Desktop Menu (Visible on larger screens) */}
        <div className="hidden sm:flex items-center gap-4">
          <span className="text-gray-700 dark:text-gray-300 text-lg">Welcome, {currentUser?.email}</span> {/* Added dark mode */}
           <button
                className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-2 px-6 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-400 focus:border-transparent transition duration-200 transform hover:scale-105 flex items-center justify-center dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-gray-200" // Minimal button style, added dark mode
                onClick={handleSettingsClick}
            >
                <Settings size={20} className="mr-2"/> Settings
            </button>
          <button
            className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-6 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition duration-200 transform hover:scale-105 flex items-center justify-center" // Destructive action color
            onClick={logout}
          >
            <LogOut size={20} className="mr-2"/> Logout
          </button>
        </div>
      </header>

      {/* Mobile Menu (Visible on small screens when open) */}
      {isMenuOpen && (
          <div className="sm:hidden fixed inset-0 bg-white dark:bg-gray-800 z-50 flex flex-col p-6 transition-colors duration-200"> {/* Added dark mode */}
              <div className="flex justify-between items-center mb-6">
                   <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Menu</h2> {/* Added dark mode */}
                   <button
                       className="text-gray-800 dark:text-gray-100 focus:outline-none" // Dark mode for icon color
                       onClick={() => setIsMenuOpen(false)}
                       aria-label="Close menu"
                   >
                       <CloseIcon size={28} />
                   </button>
              </div>
              <nav className="flex flex-col gap-4">
                   <button
                       className={`text-left text-lg py-2 px-3 rounded-lg transition duration-200 ${activeTab === 'roadmap' ? 'bg-blue-100 text-blue-700 font-semibold dark:bg-blue-900 dark:text-blue-200' : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700'}`} // Dark mode
                       onClick={() => handleTabClick('roadmap')}
                   >
                       Roadmap
                   </button>
                   <button
                       className={`text-left text-lg py-2 px-3 rounded-lg transition duration-200 ${activeTab === 'weeklyActions' ? 'bg-blue-100 text-blue-700 font-semibold dark:bg-blue-900 dark:text-blue-200' : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700'}`} // Dark mode
                       onClick={() => handleTabClick('weeklyActions')}
                   >
                       Weekly Actions
                   </button>
                    <button
                       className={`text-left text-lg py-2 px-3 rounded-lg transition duration-200 ${activeTab === 'dailyHabits' ? 'bg-blue-100 text-blue-700 font-semibold dark:bg-blue-900 dark:text-blue-200' : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700'}`} // Dark mode
                       onClick={() => handleTabClick('dailyHabits')}
                   >
                       Daily Habits
                   </button>
                    <button
                       className={`text-left text-lg py-2 px-3 rounded-lg transition duration-200 ${activeTab === 'skillLog' ? 'bg-blue-100 text-blue-700 font-semibold dark:bg-blue-900 dark:text-blue-200' : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700'}`} // Dark mode
                       onClick={() => handleTabClick('skillLog')}
                   >
                       Skill Hours Log
                   </button>
                    <button
                       className={`text-left text-lg py-2 px-3 rounded-lg transition duration-200 ${activeTab === 'brandFeed' ? 'bg-blue-100 text-blue-700 font-semibold dark:bg-blue-900 dark:text-blue-200' : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700'}`} // Dark mode
                       onClick={() => handleTabClick('brandFeed')}
                   >
                       Personal Brand Feed
                   </button>
                    <button
                       className={`text-left text-lg py-2 px-3 rounded-lg transition duration-200 ${activeTab === 'mvpTestLauncher' ? 'bg-blue-100 text-blue-700 font-semibold dark:bg-blue-900 dark:text-blue-200' : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700'}`} // Dark mode
                       onClick={() => handleTabClick('mvpTestLauncher')}
                   >
                       MVP Test Launcher
                   </button>
                    <button
                       className={`text-left text-lg py-2 px-3 rounded-lg transition duration-200 ${activeTab === 'finance' ? 'bg-blue-100 text-blue-700 font-semibold dark:bg-blue-900 dark:text-blue-200' : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700'}`} // Dark mode
                       onClick={() => handleTabClick('finance')}
                   >
                       Finance
                   </button>
                   <button
                       className="text-left text-lg py-2 px-3 rounded-lg text-gray-700 hover:bg-gray-100 transition duration-200 flex items-center dark:text-gray-300 dark:hover:bg-gray-700" // Dark mode
                       onClick={handleSettingsClick}
                   >
                       <Settings size={20} className="mr-2"/> Settings
                   </button>
                   <button
                       className="text-left text-lg py-2 px-3 rounded-lg text-red-600 hover:bg-red-100 transition duration-200 flex items-center dark:text-red-400 dark:hover:bg-red-900" // Dark mode
                       onClick={logout}
                   >
                       <LogOut size={20} className="mr-2"/> Logout
                   </button>
              </nav>
          </div>
      )}


      <div className="container mx-auto">
        {/* Added ref to the nav container */}
        {/* Navigation Tabs (Hidden on small screens) */}
        <div ref={navRef} className="hidden sm:block mb-6 border-b border-gray-200 dark:border-gray-700 overflow-x-auto overflow-y-hidden transition-colors duration-200"> {/* Added dark mode */}
          <nav className="-mb-px flex space-x-6 sm:space-x-8" aria-label="Tabs">
            <button
              // Added data-tab attribute to easily select the button
              data-tab="roadmap"
              className={`${activeTab === 'roadmap' ? 'border-blue-600 text-blue-700 font-bold dark:border-blue-400 dark:text-blue-400' : 'border-transparent text-gray-600 hover:text-gray-800 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-200 dark:hover:border-gray-500 font-medium'} whitespace-nowrap py-3 px-1 border-b-2 text-base transition duration-200 flex items-center`} // Dark mode
              onClick={() => setActiveTab('roadmap')}
            >
              <Target size={20} className="mr-2"/> Roadmap
            </button>
             <button
               // Added data-tab attribute
              data-tab="weeklyActions"
              className={`${activeTab === 'weeklyActions' ? 'border-blue-600 text-blue-700 font-bold dark:border-blue-400 dark:text-blue-400' : 'border-transparent text-gray-600 hover:text-gray-800 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-200 dark:hover:border-gray-500 font-medium'} whitespace-nowrap py-3 px-1 border-b-2 text-base transition duration-200 flex items-center`} // Dark mode
              onClick={() => setActiveTab('weeklyActions')}
            >
              <CalendarDays size={20} className="mr-2"/> Weekly Actions
            </button>
             <button
               // Added data-tab attribute
              data-tab="dailyHabits"
              className={`${activeTab === 'dailyHabits' ? 'border-blue-600 text-blue-700 font-bold dark:border-blue-400 dark:text-blue-400' : 'border-transparent text-gray-600 hover:text-gray-800 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-200 dark:hover:border-gray-500 font-medium'} whitespace-nowrap py-3 px-1 border-b-2 text-base transition duration-200 flex items-center`} // Dark mode
              onClick={() => setActiveTab('dailyHabits')}
            >
              <ListTodo size={20} className="mr-2"/> Daily Habits
            </button>
             <button
               // Added data-tab attribute
              data-tab="skillLog"
              className={`${activeTab === 'skillLog' ? 'border-blue-600 text-blue-700 font-bold dark:border-blue-400 dark:text-blue-400' : 'border-transparent text-gray-600 hover:text-gray-800 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-200 dark:hover:border-gray-500 font-medium'} whitespace-nowrap py-3 px-1 border-b-2 text-base transition duration-200 flex items-center`} // Dark mode
              onClick={() => setActiveTab('skillLog')}
            >
              <Clock size={20} className="mr-2"/> Skill Hours Log
            </button>
             <button
               // Added data-tab attribute
              data-tab="brandFeed"
              className={`${activeTab === 'brandFeed' ? 'border-blue-600 text-blue-700 font-bold dark:border-blue-400 dark:text-blue-400' : 'border-transparent text-gray-600 hover:text-gray-800 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-200 dark:hover:border-gray-500 font-medium'} whitespace-nowrap py-3 px-1 border-b-2 text-base transition duration-200 flex items-center`} // Dark mode
              onClick={() => setActiveTab('brandFeed')}
            >
              <Feather size={20} className="mr-2"/> Personal Brand Feed
            </button>
             <button
               // Added data-tab attribute
              data-tab="mvpTestLauncher"
              className={`${activeTab === 'mvpTestLauncher' ? 'border-blue-600 text-blue-700 font-bold dark:border-blue-400 dark:text-blue-400' : 'border-transparent text-gray-600 hover:text-gray-800 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-200 dark:hover:border-gray-500 font-medium'} whitespace-nowrap py-3 px-1 border-b-2 text-base transition duration-200 flex items-center`} // Dark mode
              onClick={() => setActiveTab('mvpTestLauncher')}
            >
              MVP Test Launcher
            </button>
             <button
               // Added data-tab attribute
              data-tab="finance"
              className={`${activeTab === 'finance' ? 'border-blue-600 text-blue-700 font-bold dark:border-blue-400 dark:text-blue-400' : 'border-transparent text-gray-600 hover:text-gray-800 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-200 dark:hover:border-gray-500 font-medium'} whitespace-nowrap py-3 px-1 border-b-2 text-base transition duration-200 flex items-center`} // Dark mode
              onClick={() => setActiveTab('finance')}
            >
              <DollarSign size={20} className="mr-2"/> Finance
            </button>
          </nav>
        </div>

        {renderContent()}
      </div>
    </div>
  );
};


const App = () => {
    // State to hold the current theme
    const [theme, setTheme] = useState(localStorage.getItem('theme') || 'system');

    // Effect to apply the theme class to the root html element
    useEffect(() => {
        const applyThemeClass = (selectedTheme) => {
            const root = document.documentElement;
            // Remove existing theme classes
            root.classList.remove('light', 'dark');

            if (selectedTheme === 'system') {
                // Apply dark class if system prefers dark
                if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
                    root.classList.add('dark');
                } else {
                    // Apply light class if system prefers light
                    root.classList.add('light');
                }
            } else {
                // Apply the selected theme class directly
                root.classList.add(selectedTheme);
            }
        };

        // Apply theme on initial load
        applyThemeClass(theme);

        // Save the selected theme to localStorage
        localStorage.setItem('theme', theme);

        // Listen for system theme changes if theme is set to 'system'
        const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
        const handleSystemThemeChange = () => {
            if (theme === 'system') {
                applyThemeClass('system');
            }
        };
        mediaQuery.addEventListener('change', handleSystemThemeChange);

        // Cleanup listener on component unmount
        return () => {
            mediaQuery.removeEventListener('change', handleSystemThemeChange);
        };

    }, [theme]); // Re-run effect when theme changes

    // This effect runs once on mount to listen for theme changes from the SettingsComponent
    // and update the local state and apply the class.
    // This is important for changes made in another tab/window if localStorage is shared.
    useEffect(() => {
        const handleStorageChange = (event) => {
            if (event.key === 'theme') {
                const storedTheme = event.newValue || 'system';
                setTheme(storedTheme);
            }
        };

        window.addEventListener('storage', handleStorageChange);

        return () => {
            window.removeEventListener('storage', handleStorageChange);
        };
    }, []);


  return (
    <AuthProvider>
      <div className="App">
        <link href="https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css" rel="stylesheet" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap" rel="stylesheet" />
        <style>
          {`
          body {
            font-family: 'Inter', sans-serif;
          }
          .rounded-lg {
            border-radius: 0.5rem;
          }
           .rounded-xl {
            border-radius: 0.75rem;
          }
           .rounded-2xl { /* Added for the Auth card */
            border-radius: 1rem;
          }
          button, a {
            transition: all 0.2s ease-in-out;
          }
          /* Custom style for disabled buttons */
          .bg-gray-400.cursor-not-allowed.text-gray-700:hover {
              transform: none;
          }
          /* Hide scrollbar for a cleaner look */
          .overflow-x-auto::-webkit-scrollbar {
              display: none;
          }
          .overflow-x-auto {
              -ms-overflow-style: none;  /* IE and Edge */
              scrollbar-width: none;  /* Firefox */
          }

          /* Dark Mode Styles */
          .dark .bg-gray-50 { background-color: #1f2937; } /* Darker background */
          .dark .bg-white { background-color: #111827; } /* Even darker white */
          .dark .text-gray-900 { color: #f3f4f6; } /* Light text */
          .dark .text-gray-800 { color: #e5e7eb; } /* Lighter text */
          .dark .text-gray-700 { color: #d1d5db; } /* Even lighter text */
          .dark .text-gray-600 { color: #9ca3af; } /* Still visible text */
          .dark .border-gray-200 { border-color: #374151; } /* Darker borders */
          .dark .border-gray-300 { border-color: #4b5563; } /* Darker borders */
          .dark .border-gray-500 { border-color: #6b7280; } /* Darker borders */
          .dark .shadow-md { box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06); } /* Keep some shadow */
          .dark .shadow-lg { box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05); }
          .dark .shadow-xl { box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04); }

          /* Dark mode for specific components */
          .dark .bg-blue-50 { background-color: #1e3a8a; } /* Darker blue background */
          .dark .border-blue-200 { border-color: #3b82f6; } /* Blue border */
          .dark .text-blue-800 { color: #93c5fd; } /* Lighter blue text */
          .dark .text-blue-700 { color: #60a5fa; } /* Lighter blue text */
          .dark .bg-blue-100 { background-color: #1d4ed8; } /* Darker blue background */
          .dark .border-blue-300 { border-color: #60a5fa; } /* Blue border */
          .dark .text-blue-900 { color: #bfdbfe; } /* Very light blue text */

           .dark .bg-gray-50 { background-color: #1f2937; } /* Darker background */
           .dark .border-gray-200 { border-color: #374151; } /* Darker border */
           .dark .bg-white { background-color: #111827; } /* Darker white */
           .dark .text-gray-800 { color: #e5e7eb; } /* Lighter text */
           .dark .text-gray-500 { color: #6b7280; } /* Darker strikethrough text */

           .dark .text-emerald-600 { color: #34d399; } /* Lighter green for income */
           .dark .text-red-600 { color: #f87171; } /* Lighter red for expense */

           /* Dark mode for light grey buttons (Edit, Manage Skills, Cancel, Close Settings, Inactive Theme Buttons) */
           /* Increased contrast for these buttons */
           .dark .bg-gray-200.text-gray-800 {
               background-color: #4b5563; /* Darker gray background */
               color: #e5e7eb; /* Lighter text color */
           }
           .dark .bg-gray-200.text-gray-800:hover {
               background-color: #6b7280; /* Even darker gray on hover */
           }


          `}
        </style>

        <AuthWrapper />
      </div>
    </AuthProvider>
  );
};

const AuthWrapper = () => {
    const { currentUser } = useAuth();
    return currentUser ? <Dashboard /> : <Auth />;
}


export default App;
