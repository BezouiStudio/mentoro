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
import { Plus, Edit, Trash2, Save, Check, X, DollarSign, Clock, Target, Feather, Briefcase, CalendarDays, ListTodo, BarChart2, LogOut, Settings, Mail } from 'lucide-react'; // Import Mail icon


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
  const [error, setError] = useState('');
  const [infoMessage, setInfoMessage] = useState(''); // State for info messages
  const [emailLinkSent, setEmailLinkSent] = useState(false); // State to track if email link is sent
  const [showPasswordless, setShowPasswordless] = useState(false); // State to toggle passwordless section visibility

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
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4 sm:p-6"> {/* Lighter background, added padding */}
      <div className="bg-white p-6 sm:p-8 rounded-2xl shadow-xl w-full max-w-sm border border-gray-200"> {/* More rounded corners, larger shadow, slightly wider max-width */}
        <h2 className="text-2xl sm:text-3xl font-bold mb-6 sm:mb-8 text-center text-gray-800">{isLogin ? 'Welcome Back' : 'Join Mentoro'}</h2> {/* Adjusted font size and spacing */}
        {error && <p className="text-red-500 text-sm mb-4 text-center">{error}</p>}
        {infoMessage && <p className="text-blue-600 text-sm mb-4 text-center">{infoMessage}</p>}

        {/* Email/Password Section */}
        {!emailLinkSent && !showPasswordless && ( // Hide email/password if email link is sent or passwordless is shown
            <>
                <form onSubmit={handleSubmit}>
                <div className="mb-4"> {/* Adjusted margin */}
                    <label className="block text-gray-700 text-sm font-semibold mb-2" htmlFor="email">
                    Email
                    </label>
                    <input
                    className="shadow-sm appearance-none border border-gray-300 rounded-lg w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200" // Adjusted padding
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
                    <label className="block text-gray-700 text-sm font-semibold mb-2" htmlFor="password">
                    Password
                    </label>
                    <input
                    className="shadow-sm appearance-none border border-gray-300 rounded-lg w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200" // Adjusted padding
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

                {/* Option to show passwordless login */}
                <div className="text-center mt-4">
                    <button
                        className="inline-block align-baseline font-semibold text-sm text-gray-600 hover:text-gray-800 transition duration-200"
                        type="button"
                        onClick={() => setShowPasswordless(true)}
                    >
                        Prefer passwordless login?
                    </button>
                </div>
            </>
        )}


        {/* Passwordless Sign-in Section */}
         {!emailLinkSent && showPasswordless && ( // Only show passwordless option if email link is not sent and showPasswordless is true
             <div className="mt-6">
                 <h3 className="text-xl font-semibold mb-4 text-gray-800 text-center">Login with Email Link</h3>
                 <div className="mb-4">
                     <label className="block text-gray-700 text-sm font-semibold mb-2" htmlFor="passwordlessEmail">
                         Email (Passwordless Login)
                     </label>
                     <input
                         className="shadow-sm appearance-none border border-gray-300 rounded-lg w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition duration-200" // Adjusted padding
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
                        className="inline-block align-baseline font-semibold text-sm text-gray-600 hover:text-gray-800 transition duration-200"
                        type="button"
                        onClick={() => setShowPasswordless(false)}
                    >
                        Back to password login
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

  const deleteItem = async (id) => {
    if (!currentUser) return;
    console.log("Attempting to delete roadmap item with user ID:", currentUser.uid);
    await deleteDoc(doc(db, 'roadmap', id));
    setRoadmapItems(roadmapItems.filter(item => item.id !== id));
  };

  return (
    <div id="roadmap" className="p-6 bg-white rounded-xl shadow-md mb-6"> {/* Added ID */}
      <h3 className="text-2xl font-bold mb-6 text-gray-800 flex items-center"><Target className="mr-3 text-blue-600" size={28} /> Roadmap</h3>
      <div className="mb-6 flex flex-col sm:flex-row gap-3">
        <input
          type="text"
          className="shadow-sm appearance-none border border-gray-300 rounded-lg w-full py-3 px-4 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200"
          placeholder="Add new roadmap item"
          value={newItem}
          onChange={(e) => setNewItem(e.target.value)}
        />
        <button
          className="bg-gray-800 hover:bg-gray-700 text-white font-bold py-3 px-6 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-transparent transition duration-200 transform hover:scale-105 flex-shrink-0 flex items-center justify-center" // Minimal button style
          onClick={addItem}
        >
          <Plus className="mr-2" size={20} /> Add
        </button>
      </div>
      <ul>
        {roadmapItems.map(item => (
          <li key={item.id} className="bg-gray-50 p-4 rounded-lg mb-3 flex flex-col sm:flex-row justify-between items-start sm:items-center border border-gray-200 shadow-sm">
            {editingItem === item.id ? (
              <input
                type="text"
                className="shadow-sm appearance-none border border-gray-300 rounded-lg py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200 mr-2 flex-grow w-full sm:w-auto mb-2 sm:mb-0"
                value={editText}
                onChange={(e) => setEditText(e.target.value)}
              />
            ) : (
              <span className="flex-grow text-gray-800 text-lg mr-2 mb-2 sm:mb-0">{item.text}</span>
            )}
            <div className="flex gap-2 flex-shrink-0">
              {editingItem === item.id ? (
                <button
                  className="bg-gray-800 hover:bg-gray-700 text-white text-sm py-2 px-4 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-transparent transition duration-200 transform hover:scale-105 flex items-center justify-center" // Minimal button style
                  onClick={() => updateItem(item.id)}
                >
                  <Save size={16} className="mr-1"/> <span className="hidden sm:inline">Save</span> {/* Hide text on small screens */}
                </button>
              ) : (
                <button
                  className="bg-gray-200 hover:bg-gray-300 text-gray-800 text-sm py-2 px-4 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-400 focus:border-transparent transition duration-200 transform hover:scale-105 flex items-center justify-center" // Minimal button style
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

    return (
        <div id="weeklyActions" className="p-6 bg-white rounded-xl shadow-md mb-6"> {/* Added ID */}
            <h3 className="text-2xl font-bold mb-6 text-gray-800 flex items-center"><CalendarDays className="mr-3 text-blue-600" size={28} /> Weekly Actions</h3>
            <div className="mb-6 flex flex-col sm:flex-row gap-3">
                <input
                    type="text"
                    className="shadow-sm appearance-none border border-gray-300 rounded-lg w-full py-3 px-4 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200"
                    placeholder="Add new weekly action"
                    value={newAction}
                    onChange={(e) => setNewAction(e.target.value)}
                />
                <button
                  className="bg-gray-800 hover:bg-gray-700 text-white font-bold py-3 px-6 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-transparent transition duration-200 transform hover:scale-105 flex-shrink-0 flex items-center justify-center" // Minimal button style
                  onClick={addAction}
                >
                  <Plus className="mr-2" size={20} /> Add
                </button>
            </div>
            <ul>
                {actions.map(action => (
                    <li key={action.id} className="bg-gray-50 p-4 rounded-lg mb-3 flex flex-col sm:flex-row justify-between items-start sm:items-center border border-gray-200 shadow-sm">
                        {editingAction === action.id ? (
                            <input
                                type="text"
                                className="shadow-sm appearance-none border border-gray-300 rounded-lg py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200 mr-2 flex-grow w-full sm:w-auto mb-2 sm:mb-0"
                                value={editText}
                                onChange={(e) => setEditText(e.target.value)}
                            />
                        ) : (
                            <span className={`flex-grow text-gray-800 text-lg mr-2 mb-2 sm:mb-0 ${action.completed ? 'line-through text-gray-500' : ''}`}>{action.text}</span>
                        )}
                        <div className="flex gap-2 flex-shrink-0">
                             <button
                                className={`text-sm py-2 px-4 rounded-lg transition duration-200 transform hover:scale-105 flex items-center justify-center ${action.completed ? 'bg-gray-500 hover:bg-gray-600 text-white' : 'bg-gray-800 hover:bg-gray-700 text-white'}`} // Minimal button style
                                onClick={() => toggleComplete(action)}
                                >
                                 {action.completed ? <X size={16} className="mr-1"/> : <Check size={16} className="mr-1"/>} <span className="hidden sm:inline">{action.completed ? 'Undo' : 'Complete'}</span> {/* Hide text on small screens */}
                            </button>
                            {editingAction === action.id ? (
                                <button
                                    className="bg-gray-800 hover:bg-gray-700 text-white text-sm py-2 px-4 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-transparent transition duration-200 transform hover:scale-105 flex items-center justify-center" // Minimal button style
                                    onClick={() => updateAction(action.id)}
                                >
                                    <Save size={16} className="mr-1"/> <span className="hidden sm:inline">Save</span> {/* Hide text on small screens */}
                                </button>
                            ) : (
                                <button
                                    className="bg-gray-200 hover:bg-gray-300 text-gray-800 text-sm py-2 px-4 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-400 focus:border-transparent transition duration-200 transform hover:scale-105 flex items-center justify-center" // Minimal button style
                                    onClick={() => { setEditingAction(action.id); setEditText(action.text); }}
                                >
                                    <Edit size={16} className="mr-1"/> <span className="hidden sm:inline">Edit</span> {/* Hide text on small screens */}
                                </button>
                            )}
                            <button
                                className="bg-red-600 hover:bg-red-700 text-white text-sm py-2 px-4 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition duration-200 transform hover:scale-105 flex items-center justify-center" // Destructive action color
                                onClick={() => deleteAction(action.id)}
                              >
                                <Trash2 size={16} className="mr-1"/> <span className="hidden sm:inline">Delete</span> {/* Hide text on small screens */}
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
                 } else if (lastCompletedDate.getTime() !== today.getTime()) {
                     newStreak = 1;
                 }
            } else {
                 newStreak = 1;
            }
            newLastCompletedAt = now;
        } else {
             newStreak = 0;
             newLastCompletedAt = null;
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

                    if (lastCompletedDate.getTime() < yesterday.getTime() && habit.streak > 0) {
                         const habitRef = doc(db, 'dailyHabits', habit.id);
                         updates.push(updateDoc(habitRef, { streak: 0, completedToday: false }));
                         console.log(`Resetting streak for habit ${habit.id}`);
                    } else if (lastCompletedDate.getTime() < today.getTime() && habit.completedToday) {
                         const habitRef = doc(db, 'dailyHabits', habit.id);
                         updates.push(updateDoc(habitRef, { completedToday: false }));
                         console.log(`Resetting completedToday for habit ${habit.id}`);
                    }
                } else if (habit.streak > 0) {
                     const habitRef = doc(db, 'dailyHabits', habit.id);
                     updates.push(updateDoc(habitRef, { streak: 0, completedToday: false }));
                      console.log(`Resetting streak for habit ${habit.id} (no lastCompletedAt)`);
                } else if (habit.completedToday) {
                      const habitRef = doc(db, 'dailyHabits', habit.id);
                      updates.push(updateDoc(habitRef, { completedToday: false }));
                       console.log(`Resetting completedToday for habit ${habit.id} (no lastCompletedAt)`);
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


    return (
        <div id="dailyHabits" className="p-6 bg-white rounded-xl shadow-md mb-6"> {/* Added ID */}
            <h3 className="text-2xl font-bold mb-6 text-gray-800 flex items-center"><ListTodo className="mr-3 text-blue-600" size={28} /> Daily Habits</h3>
            <div className="mb-6 flex flex-col sm:flex-row gap-3">
                <input
                    type="text"
                    className="shadow-sm appearance-none border border-gray-300 rounded-lg w-full py-3 px-4 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200"
                    placeholder="Add new daily habit"
                    value={newHabit}
                    onChange={(e) => setNewHabit(e.target.value)}
                />
                 <button
                  className="bg-gray-800 hover:bg-gray-700 text-white font-bold py-3 px-6 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-transparent transition duration-200 transform hover:scale-105 flex-shrink-0 flex items-center justify-center" // Minimal button style
                  onClick={addHabit}
                >
                  <Plus className="mr-2" size={20} /> Add
                </button>
            </div>
            <ul>
                {habits.map(habit => (
                    <li key={habit.id} className="bg-gray-50 p-4 rounded-lg mb-3 flex flex-col sm:flex-row justify-between items-start sm:items-center border border-gray-200 shadow-sm">
                        {editingHabit === habit.id ? (
                            <input
                                type="text"
                                className="shadow-sm appearance-none border border-gray-300 rounded-lg py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200 mr-2 flex-grow w-full sm:w-auto mb-2 sm:mb-0"
                                value={editText}
                                onChange={(e) => setEditText(e.target.value)}
                            />
                        ) : (
                            <span className={`flex-grow text-gray-800 text-lg mr-2 mb-2 sm:mb-0 ${habit.completedToday ? 'line-through text-gray-500' : ''}`}>
                                {habit.text} <span className="text-sm font-semibold text-blue-600">({habit.streak || 0} day streak)</span>
                            </span>
                        )}
                        <div className="flex gap-2 flex-shrink-0">
                            <button
                                className={`text-sm py-2 px-4 rounded-lg transition duration-200 transform hover:scale-105 flex items-center justify-center ${habit.completedToday ? 'bg-gray-500 hover:bg-gray-600 text-white' : 'bg-gray-800 hover:bg-gray-700 text-white'}`} // Minimal button style
                                onClick={() => toggleCompleteToday(habit)}
                                >
                                {habit.completedToday ? <X size={16} className="mr-1"/> : <Check size={16} className="mr-1"/>} <span className="hidden sm:inline">{habit.completedToday ? 'Undo' : 'Done Today'}</span> {/* Hide text on small screens */}
                            </button>
                            {editingHabit === habit.id ? (
                                <button
                                    className="bg-gray-800 hover:bg-gray-700 text-white text-sm py-2 px-4 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-transparent transition duration-200 transform hover:scale-105 flex items-center justify-center" // Minimal button style
                                    onClick={() => updateHabit(habit.id)}
                                >
                                    <Save size={16} className="mr-1"/> <span className="hidden sm:inline">Save</span> {/* Hide text on small screens */}
                                </button>
                            ) : (
                                <button
                                    className="bg-gray-200 hover:bg-gray-300 text-gray-800 text-sm py-2 px-4 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-400 focus:border-transparent transition duration-200 transform hover:scale-105 flex items-center justify-center" // Minimal button style
                                    onClick={() => { setEditingHabit(habit.id); setEditText(habit.text); }}
                                >
                                    <Edit size={16} className="mr-1"/> <span className="hidden sm:inline">Edit</span> {/* Hide text on small screens */}
                                </button>
                            )}
                            <button
                                className="bg-red-600 hover:bg-red-700 text-white text-sm py-2 px-4 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition duration-200 transform hover:scale-105 flex items-center justify-center" // Destructive action color
                                onClick={() => deleteHabit(habit.id)}
                              >
                                <Trash2 size={16} className="mr-1"/> <span className="hidden sm:inline">Delete</span> {/* Hide text on small screens */}
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


    return (
        <div id="skillLog" className="p-6 bg-white rounded-xl shadow-md mb-6"> {/* Added ID */}
            <h3 className="text-2xl font-bold mb-6 text-gray-800 flex items-center"><Clock className="mr-3 text-blue-600" size={28} /> Skill Hours Log</h3>

             {/* Action Buttons */}
            <div className="mb-6 flex flex-wrap gap-4">
                 <button
                    className="bg-gray-800 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-transparent transition duration-200 transform hover:scale-105 flex items-center justify-center" // Minimal button style
                    onClick={() => setShowAddSkillModal(true)} // Open modal
                >
                    <Plus size={16} className="mr-1"/> Add New Skill
                </button>
                 <button
                    className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-2 px-4 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-400 focus:border-transparent transition duration-200 transform hover:scale-105 flex items-center justify-center" // Minimal button style
                    onClick={() => setShowManageSkills(!showManageSkills)} // Toggle manage skills section
                >
                    <Settings size={16} className="mr-1"/> {showManageSkills ? 'Hide Manage Skills' : 'Manage Skills'}
                </button>
            </div>


             {/* Add New Skill Modal */}
            {showAddSkillModal && (
                <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full flex items-center justify-center z-50">
                    <div className="relative p-8 border w-full max-w-md md:max-w-lg lg:max-w-xl shadow-lg rounded-xl bg-white">
                        <h4 className="text-xl font-semibold mb-4 text-gray-800">Add New Skill</h4>
                        <div className="mb-4">
                            <label className="block text-gray-700 text-sm font-semibold mb-2" htmlFor="newSkillModal">
                                Skill Name
                            </label>
                            <input
                                type="text"
                                className="shadow-sm appearance-none border border-gray-300 rounded-lg w-full py-3 px-4 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition duration-200"
                                id="newSkillModal"
                                placeholder="Enter new skill name"
                                value={newSkillName}
                                onChange={(e) => setNewSkillName(e.target.value)}
                            />
                        </div>
                        <div className="flex justify-end gap-4">
                             <button
                                className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-2 px-4 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-400 focus:border-transparent transition duration-200 transform hover:scale-105" // Minimal button style
                                onClick={() => { setShowAddSkillModal(false); setNewSkillName(''); }} // Close modal and clear input
                            >
                                Cancel
                            </button>
                            <button
                                className="bg-gray-800 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-transparent transition duration-200 transform hover:scale-105" // Minimal button style
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
                 <div className="mb-8 p-6 bg-gray-50 rounded-lg shadow-sm border border-gray-200 transition-all duration-300 ease-in-out">
                    <h4 className="text-xl font-semibold mb-4 text-gray-800">Manage Skills</h4>
                    <ul>
                        {skills.map(skill => (
                            <li key={skill.id} className="bg-white p-4 rounded-lg mb-3 flex flex-col sm:flex-row justify-between items-start sm:items-center border border-gray-200 shadow-sm">
                                {editingSkill === skill.id ? (
                                    <input
                                        type="text"
                                        className="shadow-sm appearance-none border border-gray-300 rounded-lg py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200 mr-2 flex-grow w-full sm:w-auto mb-2 sm:mb-0"
                                        value={editSkillName}
                                        onChange={(e) => setEditSkillName(e.target.value)}
                                    />
                                ) : (
                                    <span className="flex-grow text-gray-800 text-lg mr-2 mb-2 sm:mb-0">{skill.skillName}</span>
                                )}
                                <div className="flex gap-2 flex-shrink-0">
                                    {editingSkill === skill.id ? (
                                        <button
                                            className="bg-gray-800 hover:bg-gray-700 text-white text-sm py-2 px-4 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-transparent transition duration-200 transform hover:scale-105 flex items-center justify-center" // Minimal button style
                                            onClick={() => updateSkillName(skill.id)}
                                        >
                                            <Save size={16} className="mr-1"/> <span className="hidden sm:inline">Save</span> {/* Hide text on small screens */}
                                        </button>
                                    ) : (
                                        <button
                                            className="bg-gray-200 hover:bg-gray-300 text-gray-800 text-sm py-2 px-4 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-400 focus:border-transparent transition duration-200 transform hover:scale-105 flex items-center justify-center" // Minimal button style
                                            onClick={() => { setEditingSkill(skill.id); setEditSkillName(skill.skillName); }}
                                        >
                                            <Edit size={16} className="mr-1"/> <span className="hidden sm:inline">Edit</span> {/* Hide text on small screens */}
                                        </button>
                                    )}
                                     <button
                                        className="bg-red-600 hover:bg-red-700 text-white text-sm py-2 px-4 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition duration-200 transform hover:scale-105 flex items-center justify-center" // Destructive action color
                                        onClick={() => deleteSkill(skill.id)}
                                    >
                                        <Trash2 size={16} className="mr-1"/> <span className="hidden sm:inline">Delete</span> {/* Hide text on small screens */}
                                    </button>
                                </div>
                            </li>
                        ))}
                         {skills.length === 0 && (
                             <li className="text-gray-600 text-center py-4">No skills added yet. Add a new skill above!</li>
                         )}
                    </ul>
                 </div>
            )}


            {/* Log Skill Time */}
            <div className="mb-8 p-6 bg-gray-50 rounded-lg shadow-sm border border-gray-200">
                <h4 className="text-xl font-semibold mb-4 text-gray-800">Log Time for Existing Skill</h4>
                <div className="flex flex-col sm:flex-row gap-4 items-end"> {/* Aligned items to bottom */}
                    <div className="flex-grow w-full"> {/* Ensured select takes full width on small screens */}
                         <label className="block text-gray-700 text-sm font-semibold mb-2" htmlFor="selectSkill">
                            Select Skill
                        </label>
                        <select
                            className="shadow-sm appearance-none border border-gray-300 rounded-lg w-full py-3 px-4 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200 bg-white"
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
                        <label className="block text-gray-700 text-sm font-semibold mb-2" htmlFor="hours">
                            Hours
                        </label>
                        <input
                            type="number"
                            className="shadow-sm appearance-none border border-gray-300 rounded-lg w-full py-3 px-4 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200"
                            placeholder="Hours"
                            value={hours}
                            onChange={(e) => setHours(e.target.value)}
                            min="0.1"
                            step="0.1"
                            disabled={skills.length === 0}
                        />
                    </div>
                    <button
                        className={`font-bold py-3 px-6 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200 transform hover:scale-105 self-end flex-shrink-0 flex items-center justify-center w-full sm:w-auto ${skills.length === 0 ? 'bg-gray-400 cursor-not-allowed text-gray-700' : 'bg-gray-800 hover:bg-gray-700 text-white'}`} // Minimal button style and refined disabled state
                        onClick={addLog}
                        disabled={skills.length === 0}
                    >
                        <Plus className="mr-2" size={20} /> Log Time
                    </button>
                </div>
            </div>

            {/* Total Time per Skill */}
            <div className="mb-8 p-6 bg-gray-50 rounded-lg shadow-sm border border-gray-200">
                 <h4 className="text-xl font-semibold mb-4 text-gray-800 flex items-center"><BarChart2 className="mr-2 text-blue-600" size={24} /> Total Time per Skill</h4>
                <ul>
                    {Object.entries(totalTimePerSkill).map(([skill, totalHours]) => (
                        <li key={skill} className="mb-2 text-gray-700 text-lg border-b border-gray-200 pb-2 last:border-b-0">
                            <strong className="text-gray-800">{skill}:</strong> {totalHours.toFixed(1)} hours
                        </li>
                    ))}
                </ul>
            </div>


            {/* Log History */}
            <div className="p-6 bg-gray-50 rounded-lg shadow-sm border border-gray-200">
                <h4 className="text-xl font-semibold mb-4 text-gray-800 flex items-center"><Briefcase className="mr-2 text-blue-600" size={24} /> Log History</h4>
                 <ul>
                    {logs.map(log => (
                        <li key={log.id} className="bg-white p-4 rounded-lg mb-3 flex flex-col sm:flex-row justify-between items-start sm:items-center border border-gray-200 shadow-sm">
                             {editingLog === log.id ? (
                                <div className="flex-grow flex flex-col sm:flex-row gap-3 mr-2 w-full sm:w-auto mb-2 sm:mb-0">
                                    <input
                                        type="text"
                                        className="shadow-sm appearance-none border border-gray-300 rounded-lg py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200 flex-grow"
                                        value={editSkillLogSkill}
                                        onChange={(e) => setEditSkillLogSkill(e.target.value)}
                                        placeholder="Skill"
                                    />
                                     <input
                                        type="number"
                                        className="shadow-sm appearance-none border border-gray-300 rounded-lg py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200 w-full sm:w-20"
                                        value={editSkillLogHours}
                                        onChange={(e) => setEditSkillLogHours(e.target.value)}
                                        min="0.1"
                                        step="0.1"
                                        placeholder="Hours"
                                    />
                                </div>
                             ) : (
                                <span className="flex-grow text-gray-800 text-lg mr-2 mb-2 sm:mb-0">
                                    <strong className="text-gray-900">{log.skill}:</strong> {log.hours} hours - <span className="text-sm text-gray-600">{log.timestamp?.toDate().toLocaleString()}</span>
                                </span>
                            )}
                            <div className="flex gap-2 flex-shrink-0">
                                {editingLog === log.id ? (
                                    <button
                                        className="bg-gray-800 hover:bg-gray-700 text-white text-sm py-2 px-4 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-transparent transition duration-200 transform hover:scale-105 flex items-center justify-center" // Minimal button style
                                        onClick={() => updateLog(log.id)}
                                    >
                                        <Save size={16} className="mr-1"/> <span className="hidden sm:inline">Save</span> {/* Hide text on small screens */}
                                    </button>
                                ) : (
                                    <button
                                        className="bg-gray-200 hover:bg-gray-300 text-gray-800 text-sm py-2 px-4 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-400 focus:border-transparent transition duration-200 transform hover:scale-105 flex items-center justify-center" // Minimal button style
                                        onClick={() => { setEditingLog(log.id); setEditSkillLogSkill(log.skill); setEditSkillLogHours(log.hours.toString()); }}
                                    >
                                        <Edit size={16} className="mr-1"/> <span className="hidden sm:inline">Edit</span> {/* Hide text on small screens */}
                                    </button>
                                )}
                                <button
                                    className="bg-red-600 hover:bg-red-700 text-white text-sm py-2 px-4 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition duration-200 transform hover:scale-105 flex items-center justify-center" // Destructive action color
                                    onClick={() => deleteLog(log.id)}
                                >
                                    <Trash2 size={16} className="mr-1"/> <span className="hidden sm:inline">Delete</span> {/* Hide text on small screens */}
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
    return (
        <div id="brandFeed" className="p-6 bg-white rounded-xl shadow-md mb-6"> {/* Added ID */}
            <h3 className="text-2xl font-bold mb-6 text-gray-800 flex items-center"><Feather className="mr-3 text-blue-600" size={28} /> Personal Brand Feed</h3>
            <div className="mb-6 flex flex-col sm:flex-row gap-3">
                <input
                    type="text"
                    className="shadow-sm appearance-none border border-gray-300 rounded-lg w-full py-3 px-4 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200"
                    placeholder="Add a personal brand note or idea"
                    value={newItem}
                    onChange={(e) => setNewItem(e.target.value)}
                />
                 <button
                  className="bg-gray-800 hover:bg-gray-700 text-white font-bold py-3 px-6 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-transparent transition duration-200 transform hover:scale-105 flex-shrink-0 flex items-center justify-center" // Minimal button style
                  onClick={addItem}
                >
                  <Plus className="mr-2" size={20} /> Add
                </button>
            </div>
             <ul>
                {feedItems.map(item => (
                    <li key={item.id} className="bg-gray-50 p-4 rounded-lg mb-3 flex flex-col sm:flex-row justify-between items-start sm:items-center border border-gray-200 shadow-sm">
                         {editingItem === item.id ? (
                            <input
                                type="text"
                                className="shadow-sm appearance-none border border-gray-300 rounded-lg py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200 mr-2 flex-grow w-full sm:w-auto mb-2 sm:mb-0"
                                value={editText}
                                onChange={(e) => setEditText(e.target.value)}
                            />
                        ) : (
                            <span className="flex-grow text-gray-800 text-lg mr-2 mb-2 sm:mb-0">{item.text}</span>
                        )}
                        <div className="flex gap-2 flex-shrink-0">
                             {editingItem === item.id ? (
                                <button
                                    className="bg-gray-800 hover:bg-gray-700 text-white text-sm py-2 px-4 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-transparent transition duration-200 transform hover:scale-105 flex items-center justify-center" // Minimal button style
                                    onClick={() => updateItem(item.id)}
                                >
                                    <Save size={16} className="mr-1"/> <span className="hidden sm:inline">Save</span> {/* Hide text on small screens */}
                                </button>
                            ) : (
                                <button
                                    className="bg-gray-200 hover:bg-gray-300 text-gray-800 text-sm py-2 px-4 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-400 focus:border-transparent transition duration-200 transform hover:scale-105 flex items-center justify-center" // Minimal button style
                                    onClick={() => { setEditingItem(item.id); setEditText(item.text); }}
                                >
                                    <Edit size={16} className="mr-1"/> <span className="hidden sm:inline">Edit</span> {/* Hide text on small screens */}
                                </button>
                            )}
                            <button
                                className="bg-red-600 hover:bg-red-700 text-white text-sm py-2 px-4 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition duration-200 transform hover:scale-105 flex items-center justify-center" // Destructive action color
                                onClick={() => deleteItem(item.id)}
                              >
                                <Trash2 size={16} className="mr-1"/> <span className="hidden sm:inline">Delete</span> {/* Hide text on small screens */}
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
        <div id="mvpTestLauncher" className="p-6 bg-white rounded-xl shadow-md mb-6"> {/* Added ID */}
            <h3 className="text-2xl font-bold mb-6 text-gray-800">MVP Test Launcher</h3>
            <p className="text-gray-700 text-lg">This section is for launching MVP tests. Implementation details would depend on the nature of the tests.</p>
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


    return (
        <div id="finance" className="p-6 bg-white rounded-xl shadow-md mb-6"> {/* Added ID */}
            <h3 className="text-2xl font-bold mb-6 text-gray-800 flex items-center"><DollarSign className="mr-3 text-green-600" size={28} /> Income/Expense</h3>

            <div className="mb-8 p-6 bg-gray-50 rounded-lg shadow-sm border border-gray-200">
                <h4 className="text-xl font-semibold mb-4 text-gray-800">Add Transaction</h4>
                 <div className="flex flex-col sm:flex-row gap-4">
                    <div className="flex-grow">
                        <label className="block text-gray-700 text-sm font-semibold mb-2" htmlFor="description">
                            Description
                        </label>
                        <input
                            type="text"
                            className="shadow-sm appearance-none border border-gray-300 rounded-lg w-full py-3 px-4 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200"
                            placeholder="Description"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                        />
                    </div>
                    <div>
                        <label className="block text-gray-700 text-sm font-semibold mb-2" htmlFor="amount">
                            Amount
                        </label>
                        <input
                            type="number"
                            className="shadow-sm appearance-none border border-gray-300 rounded-lg w-full py-3 px-4 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200"
                            placeholder="Amount"
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            min="0.01"
                            step="0.01"
                        />
                    </div>
                    <div>
                         <label className="block text-gray-700 text-sm font-semibold mb-2" htmlFor="type">
                            Type
                        </label>
                        <select
                            className="shadow-sm appearance-none border border-gray-300 rounded-lg w-full py-3 px-4 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200 bg-white"
                            value={type}
                            onChange={(e) => setType(e.target.value)}
                        >
                            <option value="income">Income</option>
                            <option value="expense">Expense</option>
                        </select>
                    </div>
                     <button
                        className="bg-gray-800 hover:bg-gray-700 text-white font-bold py-3 px-6 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-transparent transition duration-200 transform hover:scale-105 self-end flex-shrink-0 flex items-center justify-center" // Minimal button style
                        onClick={addTransaction}
                    >
                        <Plus className="mr-2" size={20} /> Add Transaction
                    </button>
                </div>
            </div>

            {/* Summary */}
            <div className="mb-8 p-6 bg-gray-50 rounded-lg shadow-sm border border-gray-200">
                 <h4 className="text-xl font-semibold mb-4 text-gray-800">Summary</h4>
                <p className="text-gray-700 text-lg mb-2">
                    <strong className="text-emerald-600">Total Income:</strong> ${totalIncome.toFixed(2)} {/* Updated color */}
                </p>
                <p className="text-gray-700 text-lg mb-2">
                    <strong className="text-red-600">Total Expense:</strong> ${totalExpense.toFixed(2)}
                </p>
                <p className="text-gray-800 text-xl font-bold">
                    Net Balance: ${netBalance.toFixed(2)}
                </p>
            </div>

            {/* Transaction History */}
            <div className="p-6 bg-gray-50 rounded-lg shadow-sm border border-gray-200">
                <h4 className="text-xl font-semibold mb-4 text-gray-800">Transaction History</h4>
                 <ul>
                    {transactions.map(transaction => (
                        <li key={transaction.id} className="bg-white p-4 rounded-lg mb-3 flex flex-col sm:flex-row justify-between items-start sm:items-center border border-gray-200 shadow-sm">
                             {editingTransaction === transaction.id ? (
                                <div className="flex-grow flex flex-col sm:flex-row gap-3 mr-2 w-full sm:w-auto mb-2 sm:mb-0">
                                    <input
                                        type="text"
                                        className="shadow-sm appearance-none border border-gray-300 rounded-lg py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200 flex-grow"
                                        value={editDescription}
                                        onChange={(e) => setEditDescription(e.target.value)}
                                        placeholder="Description"
                                    />
                                     <input
                                        type="number"
                                        className="shadow-sm appearance-none border border-gray-300 rounded-lg py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200 w-full sm:w-20"
                                        value={editAmount}
                                        onChange={(e) => setEditAmount(e.target.value)}
                                        min="0.01"
                                        step="0.01"
                                        placeholder="Amount"
                                    />
                                     <select
                                        className="shadow-sm appearance-none border border-gray-300 rounded-lg py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200 w-full sm:w-24 bg-white"
                                        value={editType}
                                        onChange={(e) => setEditType(e.target.value)}
                                    >
                                        <option value="income">Income</option>
                                        <option value="expense">Expense</option>
                                    </select>
                                </div>
                             ) : (
                                <span className={`flex-grow text-lg mr-2 mb-2 sm:mb-0 ${transaction.type === 'expense' ? 'text-red-600' : 'text-emerald-600'}`}> {/* Updated income text color */}
                                    <strong className="text-gray-900">{transaction.description}:</strong> ${transaction.amount.toFixed(2)} ({transaction.type}) - <span className="text-sm text-gray-600">{transaction.timestamp?.toDate().toLocaleString()}</span>
                                </span>
                            )}
                            <div className="flex gap-2 flex-shrink-0">
                                {editingTransaction === transaction.id ? (
                                    <button
                                        className="bg-gray-800 hover:bg-gray-700 text-white text-sm py-2 px-4 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-transparent transition duration-200 transform hover:scale-105 flex items-center justify-center" // Minimal button style
                                        onClick={() => updateTransaction(log.id)}
                                    >
                                        <Save size={16} className="mr-1"/> <span className="hidden sm:inline">Save</span> {/* Hide text on small screens */}
                                    </button>
                                ) : (
                                    <button
                                        className="bg-gray-200 hover:bg-gray-300 text-gray-800 text-sm py-2 px-4 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-400 focus:border-transparent transition duration-200 transform hover:scale-105 flex items-center justify-center" // Minimal button style
                                        onClick={() => { setEditingTransaction(log.id); setEditDescription(log.description); setEditAmount(log.amount.toString()); setEditType(log.type); }}
                                    >
                                        <Edit size={16} className="mr-1"/> <span className="hidden sm:inline">Edit</span> {/* Hide text on small screens */}
                                    </button>
                                )}
                                <button
                                    className="bg-red-600 hover:bg-red-700 text-white text-sm py-2 px-4 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition duration-200 transform hover:scale-105 flex items-center justify-center" // Destructive action color
                                    onClick={() => deleteTransaction(log.id)}
                                >
                                    <Trash2 size={16} className="mr-1"/> <span className="hidden sm:inline">Delete</span> {/* Hide text on small screens */}
                                </button>
                            </div>
                        </li>
                    ))}
                </ul>
            </div>
        </div>
    );
};


const Dashboard = () => {
  const { currentUser, logout } = useAuth();
  // Initialize activeTab from localStorage or default to 'roadmap'
  const [activeTab, setActiveTab] = useState(localStorage.getItem('activeTab') || 'roadmap');

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


  const renderContent = () => {
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
    <div className="min-h-screen bg-gray-50 p-4"> {/* Softened background */}
      <header className="bg-white shadow-md py-4 px-6 flex flex-col sm:flex-row justify-between items-center rounded-xl mb-6">
        <h1 className="text-3xl font-bold text-gray-800 mb-4 sm:mb-0">Mentoro</h1>
        <div className="flex items-center flex-col sm:flex-row gap-4">
          <span className="text-gray-700 text-lg">Welcome, {currentUser?.email}</span>
          <button
            className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-6 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition duration-200 transform hover:scale-105 flex items-center justify-center" // Destructive action color
            onClick={logout}
          >
            <LogOut size={20} className="mr-2"/> Logout
          </button>
        </div>
      </header>
      <div className="container mx-auto">
        {/* Added ref to the nav container */}
        <div ref={navRef} className="mb-6 border-b border-gray-200 overflow-x-auto overflow-y-hidden">
          <nav className="-mb-px flex space-x-6 sm:space-x-8" aria-label="Tabs">
            <button
              // Added data-tab attribute to easily select the button
              data-tab="roadmap"
              className={`${activeTab === 'roadmap' ? 'border-blue-600 text-blue-700 font-bold' : 'border-transparent text-gray-600 hover:text-gray-800 hover:border-gray-300 font-medium'} whitespace-nowrap py-3 px-1 border-b-2 text-base transition duration-200 flex items-center`}
              onClick={() => setActiveTab('roadmap')}
            >
              <Target size={20} className="mr-2"/> Roadmap
            </button>
             <button
               // Added data-tab attribute
              data-tab="weeklyActions"
              className={`${activeTab === 'weeklyActions' ? 'border-blue-600 text-blue-700 font-bold' : 'border-transparent text-gray-600 hover:text-gray-800 hover:border-gray-300 font-medium'} whitespace-nowrap py-3 px-1 border-b-2 text-base transition duration-200 flex items-center`}
              onClick={() => setActiveTab('weeklyActions')}
            >
              <CalendarDays size={20} className="mr-2"/> Weekly Actions
            </button>
             <button
               // Added data-tab attribute
              data-tab="dailyHabits"
              className={`${activeTab === 'dailyHabits' ? 'border-blue-600 text-blue-700 font-bold' : 'border-transparent text-gray-600 hover:text-gray-800 hover:border-gray-300 font-medium'} whitespace-nowrap py-3 px-1 border-b-2 text-base transition duration-200 flex items-center`}
              onClick={() => setActiveTab('dailyHabits')}
            >
              <ListTodo size={20} className="mr-2"/> Daily Habits
            </button>
             <button
               // Added data-tab attribute
              data-tab="skillLog"
              className={`${activeTab === 'skillLog' ? 'border-blue-600 text-blue-700 font-bold' : 'border-transparent text-gray-600 hover:text-gray-800 hover:border-gray-300 font-medium'} whitespace-nowrap py-3 px-1 border-b-2 text-base transition duration-200 flex items-center`}
              onClick={() => setActiveTab('skillLog')}
            >
              <Clock size={20} className="mr-2"/> Skill Hours Log
            </button>
             <button
               // Added data-tab attribute
              data-tab="brandFeed"
              className={`${activeTab === 'brandFeed' ? 'border-blue-600 text-blue-700 font-bold' : 'border-transparent text-gray-600 hover:text-gray-800 hover:border-gray-300 font-medium'} whitespace-nowrap py-3 px-1 border-b-2 text-base transition duration-200 flex items-center`}
              onClick={() => setActiveTab('brandFeed')}
            >
              <Feather size={20} className="mr-2"/> Personal Brand Feed
            </button>
             <button
               // Added data-tab attribute
              data-tab="mvpTestLauncher"
              className={`${activeTab === 'mvpTestLauncher' ? 'border-blue-600 text-blue-700 font-bold' : 'border-transparent text-gray-600 hover:text-gray-800 hover:border-gray-300 font-medium'} whitespace-nowrap py-3 px-1 border-b-2 text-base transition duration-200 flex items-center`}
              onClick={() => setActiveTab('mvpTestLauncher')}
            >
              MVP Test Launcher
            </button>
             <button
               // Added data-tab attribute
              data-tab="finance"
              className={`${activeTab === 'finance' ? 'border-blue-600 text-blue-700 font-bold' : 'border-transparent text-gray-600 hover:text-gray-800 hover:border-gray-300 font-medium'} whitespace-nowrap py-3 px-1 border-b-2 text-base transition duration-200 flex items-center`}
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

  return (
    <AuthProvider>
      <div className="App">
        <link href="https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css" rel="stylesheet" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap" rel="stylesheet" />
        <style>
          {`
          body {
            font-family: 'Inter', sans-serif;
            background-color: #f9fafb; /* Even lighter background */
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
