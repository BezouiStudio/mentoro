import React, { useState, useEffect, createContext, useContext } from 'react';
import { initializeApp } from 'firebase/app';
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
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
  Timestamp // Import Timestamp for date comparisons
} from 'firebase/firestore';

// Firebase Configuration
const firebaseConfig = {
  apiKey: "AIzaSyAi1bx2_HJ8nLDvd2F6wtFdqf1i-0clfe4",
  authDomain: "mentoro-16b0f.firebaseapp.com",
  projectId: "mentoro-16b0f",
  storageBucket: "mentoro-16b0f.firebasestorage.app",
  messagingSenderId: "683339820589",
  appId: "1:683339820589:web:44fce3970fac92c411192a4",
  measurementId: "G-XF2K333FL7"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Auth Context
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

// Protected Route Component (Basic Example)
const ProtectedRoute = ({ children }) => {
  const { currentUser } = useAuth();
  // In a real app, you would use React Router for navigation and protected routes
  // For simplicity here, we'll just render children if user is logged in
  if (!currentUser) {
    return <Auth />; // Redirect to auth if not logged in
  }
  return children;
};

// --- Authentication Components ---

const Auth = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { signup, login } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
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

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
        <h2 className="text-2xl font-bold mb-6 text-center">{isLogin ? 'Login' : 'Sign Up'}</h2>
        {error && <p className="text-red-500 text-sm mb-4">{error}</p>}
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="email">
              Email
            </label>
            <input
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              id="email"
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="mb-6">
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="password">
              Password
            </label>
            <input
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 mb-3 leading-tight focus:outline-none focus:shadow-outline"
              id="password"
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <div className="flex items-center justify-between">
            <button
              className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
              type="submit"
            >
              {isLogin ? 'Login' : 'Sign Up'}
            </button>
            <button
              className="inline-block align-baseline font-bold text-sm text-blue-500 hover:text-blue-800"
              type="button"
              onClick={() => setIsLogin(!isLogin)}
            >
              {isLogin ? 'Need an account? Sign Up' : 'Already have an account? Login'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// --- Feature Components (Basic Structure) ---

const Roadmap = () => {
  const { currentUser } = useAuth();
  const [roadmapItems, setRoadmapItems] = useState([]);
  const [newItem, setNewItem] = useState('');
  const [editingItem, setEditingItem] = useState(null);
  const [editText, setEditText] = useState('');

  useEffect(() => {
    const fetchRoadmap = async () => {
      // Added check for currentUser
      if (!currentUser) {
          console.log("Roadmap: No user logged in, skipping fetch.");
          return;
      }
      const q = query(collection(db, 'roadmap'), where('userId', '==', currentUser.uid), orderBy('createdAt', 'asc'));
      const querySnapshot = await getDocs(q);
      setRoadmapItems(querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    };
    fetchRoadmap();
  }, [currentUser]); // Depend on currentUser

  const addItem = async () => {
    if (newItem.trim() === '' || !currentUser) return;
    console.log("Attempting to add roadmap item with user ID:", currentUser.uid); // Added log
    await addDoc(collection(db, 'roadmap'), {
      text: newItem,
      userId: currentUser.uid,
      createdAt: serverTimestamp(),
    });
    setNewItem('');
    // Re-fetch or update state locally
    const q = query(collection(db, 'roadmap'), where('userId', '==', currentUser.uid), orderBy('createdAt', 'asc'));
    const querySnapshot = await getDocs(q);
    setRoadmapItems(querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
  };

  const updateItem = async (id) => {
    if (editText.trim() === '' || !currentUser) return; // Added currentUser check
    console.log("Attempting to update roadmap item with user ID:", currentUser.uid); // Added log
    const itemRef = doc(db, 'roadmap', id);
    await updateDoc(itemRef, { text: editText });
    setEditingItem(null);
    setEditText('');
    // Re-fetch or update state locally
    const q = query(collection(db, 'roadmap'), where('userId', '==', currentUser.uid), orderBy('createdAt', 'asc'));
    const querySnapshot = await getDocs(q);
    setRoadmapItems(querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
  };

  const deleteItem = async (id) => {
    if (!currentUser) return; // Added currentUser check
    console.log("Attempting to delete roadmap item with user ID:", currentUser.uid); // Added log
    await deleteDoc(doc(db, 'roadmap', id));
    // Update state locally
    setRoadmapItems(roadmapItems.filter(item => item.id !== id));
  };

  return (
    <div className="p-4">
      <h3 className="text-xl font-semibold mb-4">Roadmap</h3>
      <div className="mb-4 flex">
        <input
          type="text"
          className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline mr-2"
          placeholder="Add new roadmap item"
          value={newItem}
          onChange={(e) => setNewItem(e.target.value)}
        />
        <button
          className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
          onClick={addItem}
        >
          Add
        </button>
      </div>
      <ul>
        {roadmapItems.map(item => (
          <li key={item.id} className="bg-gray-100 p-3 rounded-md mb-2 flex justify-between items-center">
            {editingItem === item.id ? (
              <input
                type="text"
                className="shadow appearance-none border rounded py-1 px-2 text-gray-700 leading-tight focus:outline-none focus:shadow-outline mr-2 flex-grow"
                value={editText}
                onChange={(e) => setEditText(e.target.value)}
              />
            ) : (
              <span className="flex-grow">{item.text}</span>
            )}
            <div>
              {editingItem === item.id ? (
                <button
                  className="bg-blue-500 hover:bg-blue-700 text-white text-sm py-1 px-2 rounded mr-2"
                  onClick={() => updateItem(item.id)}
                >
                  Save
                </button>
              ) : (
                <button
                  className="bg-yellow-500 hover:bg-yellow-700 text-white text-sm py-1 px-2 rounded mr-2"
                  onClick={() => { setEditingItem(item.id); setEditText(item.text); }}
                >
                  Edit
                </button>
              )}
              <button
                className="bg-red-500 hover:bg-red-700 text-white text-sm py-1 px-2 rounded"
                onClick={() => deleteItem(item.id)}
              >
                Delete
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
            // Added check for currentUser
            if (!currentUser) {
                console.log("WeeklyActions: No user logged in, skipping fetch.");
                return;
            }
            const q = query(collection(db, 'weeklyActions'), where('userId', '==', currentUser.uid), orderBy('createdAt', 'asc'));
            const querySnapshot = await getDocs(q);
            setActions(querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        };
        fetchActions();
    }, [currentUser]); // Depend on currentUser

    const addAction = async () => {
        if (newAction.trim() === '' || !currentUser) return;
        console.log("Attempting to add weekly action with user ID:", currentUser.uid); // Added log
        await addDoc(collection(db, 'weeklyActions'), {
            text: newAction,
            userId: currentUser.uid,
            completed: false,
            createdAt: serverTimestamp(),
        });
        setNewAction('');
        // Re-fetch or update state locally
        const q = query(collection(db, 'weeklyActions'), where('userId', '==', currentUser.uid), orderBy('createdAt', 'asc'));
        const querySnapshot = await getDocs(q);
        setActions(querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    };

    const updateAction = async (id) => {
        if (editText.trim() === '' || !currentUser) return; // Added currentUser check
        console.log("Attempting to update weekly action with user ID:", currentUser.uid); // Added log
        const actionRef = doc(db, 'weeklyActions', id);
        await updateDoc(actionRef, { text: editText });
        setEditingAction(null);
        setEditText('');
        // Re-fetch or update state locally
        const q = query(collection(db, 'weeklyActions'), where('userId', '==', currentUser.uid), orderBy('createdAt', 'asc'));
        const querySnapshot = await getDocs(q);
        setActions(querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    };

    const toggleComplete = async (action) => {
         if (!currentUser) return; // Added currentUser check
         console.log("Attempting to toggle complete weekly action with user ID:", currentUser.uid); // Added log
        const actionRef = doc(db, 'weeklyActions', action.id);
        await updateDoc(actionRef, { completed: !action.completed });
        // Update state locally
        setActions(actions.map(a => a.id === action.id ? { ...a, completed: !a.completed } : a));
    };


    const deleteAction = async (id) => {
         if (!currentUser) return; // Added currentUser check
         console.log("Attempting to delete weekly action with user ID:", currentUser.uid); // Added log
        await deleteDoc(doc(db, 'weeklyActions', id));
        // Update state locally
        setActions(actions.filter(action => action.id !== id));
    };

    return (
        <div className="p-4">
            <h3 className="text-xl font-semibold mb-4">Weekly Actions</h3>
            <div className="mb-4 flex">
                <input
                    type="text"
                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline mr-2"
                    placeholder="Add new weekly action"
                    value={newAction}
                    onChange={(e) => setNewAction(e.target.value)}
                />
                <button
                    className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
                    onClick={addAction}
                >
                    Add
                </button>
            </div>
            <ul>
                {actions.map(action => (
                    <li key={action.id} className="bg-gray-100 p-3 rounded-md mb-2 flex justify-between items-center">
                        {editingAction === action.id ? (
                            <input
                                type="text"
                                className="shadow appearance-none border rounded py-1 px-2 text-gray-700 leading-tight focus:outline-none focus:shadow-outline mr-2 flex-grow"
                                value={editText}
                                onChange={(e) => setEditText(e.target.value)}
                            />
                        ) : (
                            <span className={`flex-grow ${action.completed ? 'line-through text-gray-500' : ''}`}>{action.text}</span>
                        )}
                        <div>
                             <button
                                className={`text-sm py-1 px-2 rounded mr-2 ${action.completed ? 'bg-gray-500 hover:bg-gray-700' : 'bg-purple-500 hover:bg-purple-700'} text-white`}
                                onClick={() => toggleComplete(action)}
                                >
                                {action.completed ? 'Undo' : 'Complete'}
                            </button>
                            {editingAction === action.id ? (
                                <button
                                    className="bg-blue-500 hover:bg-blue-700 text-white text-sm py-1 px-2 rounded mr-2"
                                    onClick={() => updateAction(action.id)}
                                >
                                    Save
                                </button>
                            ) : (
                                <button
                                    className="bg-yellow-500 hover:bg-yellow-700 text-white text-sm py-1 px-2 rounded mr-2"
                                    onClick={() => { setEditingAction(action.id); setEditText(action.text); }}
                                >
                                    Edit
                                </button>
                            )}
                            <button
                                className="bg-red-500 hover:bg-red-700 text-white text-sm py-1 px-2 rounded"
                                onClick={() => deleteAction(action.id)}
                            >
                                Delete
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
            setHabits(querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        };
        fetchHabits();
    }, [currentUser]);

    const addHabit = async () => {
        if (newHabit.trim() === '' || !currentUser) return;
        console.log("Attempting to add daily habit with user ID:", currentUser.uid);
        await addDoc(collection(db, 'dailyHabits'), {
            text: newHabit,
            userId: currentUser.uid,
            completedToday: false,
            streak: 0, // Initialize streak
            lastCompletedAt: null, // Initialize last completed timestamp
            createdAt: serverTimestamp(),
        });
        setNewHabit('');
        // Re-fetch or update state locally
        const q = query(collection(db, 'dailyHabits'), where('userId', '==', currentUser.uid), orderBy('createdAt', 'asc'));
        const querySnapshot = await getDocs(q);
        setHabits(querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    };

    const updateHabit = async (id) => {
        if (editText.trim() === '' || !currentUser) return;
        console.log("Attempting to update daily habit with user ID:", currentUser.uid);
        const habitRef = doc(db, 'dailyHabits', id);
        await updateDoc(habitRef, { text: editText });
        setEditingHabit(null);
        setEditText('');
        // Re-fetch or update state locally
        const q = query(collection(db, 'dailyHabits'), where('userId', '==', currentUser.uid), orderBy('createdAt', 'asc'));
        const querySnapshot = await getDocs(q);
        setHabits(querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
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
            // Mark as complete
            if (habit.lastCompletedAt) {
                 const lastCompletedDate = new Date(habit.lastCompletedAt.toDate().getFullYear(), habit.lastCompletedAt.toDate().getMonth(), habit.lastCompletedAt.toDate().getDate());
                 const yesterday = new Date(today);
                 yesterday.setDate(today.getDate() - 1);

                 if (lastCompletedDate.getTime() === yesterday.getTime()) {
                     // Completed yesterday, increment streak
                     newStreak = (habit.streak || 0) + 1;
                 } else if (lastCompletedDate.getTime() !== today.getTime()) {
                     // Not completed today or yesterday, start new streak
                     newStreak = 1;
                 }
                 // If completed today already, streak doesn't change
            } else {
                 // First completion, start streak
                 newStreak = 1;
            }
            newLastCompletedAt = now; // Update last completed timestamp
        } else {
            // Mark as incomplete - reset streak (simplified client-side reset)
            // A more robust system might require checking if the *previous* day was completed
             newStreak = 0;
             newLastCompletedAt = null; // Optionally reset last completed date if marking incomplete
        }


        await updateDoc(habitRef, {
            completedToday: newCompletedToday,
            streak: newStreak,
            lastCompletedAt: newLastCompletedAt,
        });

        // Update state locally
        setHabits(habits.map(h => h.id === habit.id ? { ...h, completedToday: newCompletedToday, streak: newStreak, lastCompletedAt: newLastCompletedAt } : h));
    };


    const deleteHabit = async (id) => {
         if (!currentUser) return;
         console.log("Attempting to delete daily habit with user ID:", currentUser.uid);
        await deleteDoc(doc(db, 'dailyHabits', id));
        // Update state locally
        setHabits(habits.filter(habit => habit.id !== id));
    };

    // Basic client-side check to potentially reset streaks if a day is missed.
    // This is not fully robust and a server-side solution is recommended for accuracy.
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

                    // If last completed date is before yesterday and the streak is > 0, reset streak
                    if (lastCompletedDate.getTime() < yesterday.getTime() && habit.streak > 0) {
                         const habitRef = doc(db, 'dailyHabits', habit.id);
                         updates.push(updateDoc(habitRef, { streak: 0, completedToday: false })); // Reset completedToday for a new day
                         console.log(`Resetting streak for habit ${habit.id}`);
                    } else if (lastCompletedDate.getTime() < today.getTime() && habit.completedToday) {
                         // If last completed was before today, but completedToday is true (from a previous day's state), reset completedToday
                         const habitRef = doc(db, 'dailyHabits', habit.id);
                         updates.push(updateDoc(habitRef, { completedToday: false }));
                         console.log(`Resetting completedToday for habit ${habit.id}`);
                    }
                } else if (habit.streak > 0) {
                     // If no lastCompletedAt but streak > 0, reset streak (shouldn't happen with initial data)
                     const habitRef = doc(db, 'dailyHabits', habit.id);
                     updates.push(updateDoc(habitRef, { streak: 0, completedToday: false }));
                      console.log(`Resetting streak for habit ${habit.id} (no lastCompletedAt)`);
                } else if (habit.completedToday) {
                     // If completedToday is true but lastCompletedAt is null (shouldn't happen), reset completedToday
                      const habitRef = doc(db, 'dailyHabits', habit.id);
                      updates.push(updateDoc(habitRef, { completedToday: false }));
                       console.log(`Resetting completedToday for habit ${habit.id} (no lastCompletedAt)`);
                }
            });

            if (updates.length > 0) {
                await Promise.all(updates);
                 // Re-fetch habits after potential updates
                 const q = query(collection(db, 'dailyHabits'), where('userId', '==', currentUser.uid), orderBy('createdAt', 'asc'));
                 const querySnapshot = await getDocs(q);
                 setHabits(querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
            }
        };

        // Run the check when habits are loaded or currentUser changes
        checkAndResetStreaks();
         // Set up a daily check (this is a very basic client-side approach)
         // A more reliable method would be a server-side scheduled function
         const now = new Date();
         const tomorrow = new Date(now);
         tomorrow.setDate(now.getDate() + 1);
         tomorrow.setHours(0, 0, 0, 0); // Set to the beginning of tomorrow

         const timeUntilTomorrow = tomorrow.getTime() - now.getTime();

         const timer = setTimeout(checkAndResetStreaks, timeUntilTomorrow);

         return () => clearTimeout(timer); // Clean up the timer

    }, [habits, currentUser]); // Depend on habits and currentUser


    return (
        <div className="p-4">
            <h3 className="text-xl font-semibold mb-4">Daily Habits</h3>
            <div className="mb-4 flex">
                <input
                    type="text"
                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline mr-2"
                    placeholder="Add new daily habit"
                    value={newHabit}
                    onChange={(e) => setNewHabit(e.target.value)}
                />
                <button
                    className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
                    onClick={addHabit}
                >
                    Add
                </button>
            </div>
            <ul>
                {habits.map(habit => (
                    <li key={habit.id} className="bg-gray-100 p-3 rounded-md mb-2 flex justify-between items-center">
                        {editingHabit === habit.id ? (
                            <input
                                type="text"
                                className="shadow appearance-none border rounded py-1 px-2 text-gray-700 leading-tight focus:outline-none focus:shadow-outline mr-2 flex-grow"
                                value={editText}
                                onChange={(e) => setEditText(e.target.value)}
                            />
                        ) : (
                            <span className={`flex-grow ${habit.completedToday ? 'line-through text-gray-500' : ''}`}>
                                {habit.text} <span className="text-sm text-gray-600">({habit.streak || 0} day streak)</span> {/* Display streak */}
                            </span>
                        )}
                        <div>
                            <button
                                className={`text-sm py-1 px-2 rounded mr-2 ${habit.completedToday ? 'bg-gray-500 hover:bg-gray-700' : 'bg-purple-500 hover:bg-purple-700'} text-white`}
                                onClick={() => toggleCompleteToday(habit)}
                                >
                                {habit.completedToday ? 'Undo' : 'Done Today'}
                            </button>
                            {editingHabit === habit.id ? (
                                <button
                                    className="bg-blue-500 hover:bg-blue-700 text-white text-sm py-1 px-2 rounded mr-2"
                                    onClick={() => updateHabit(habit.id)}
                                >
                                    Save
                                </button>
                            ) : (
                                <button
                                    className="bg-yellow-500 hover:bg-yellow-700 text-white text-sm py-1 px-2 rounded mr-2"
                                    onClick={() => { setEditingHabit(habit.id); setEditText(habit.text); }}
                                >
                                    Edit
                                </button>
                            )}
                            <button
                                className="bg-red-500 hover:bg-red-700 text-white text-sm py-1 px-2 rounded"
                                onClick={() => deleteHabit(habit.id)}
                            >
                                Delete
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
    const [skills, setSkills] = useState([]); // List of saved skills
    const [newSkillName, setNewSkillName] = useState(''); // State for adding a new skill
    const [selectedSkill, setSelectedSkill] = useState(''); // State for selecting an existing skill
    const [hours, setHours] = useState('');
    const [editingLog, setEditingLog] = useState(null);
    const [editSkill, setEditSkill] = useState('');
    const [editHours, setEditHours] = useState('');

    // Effect to fetch logs
    useEffect(() => {
        const fetchLogs = async () => {
            if (!currentUser) {
                console.log("SkillHoursLog: No user logged in, skipping logs fetch.");
                return;
            }
            const q = query(collection(db, 'skillLogs'), where('userId', '==', currentUser.uid), orderBy('timestamp', 'desc'));
            const querySnapshot = await getDocs(q);
            setLogs(querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        };
        fetchLogs();
    }, [currentUser]); // Depend on currentUser

     // Effect to fetch skills
    useEffect(() => {
        const fetchSkills = async () => {
            if (!currentUser) {
                console.log("SkillHoursLog: No user logged in, skipping skills fetch.");
                return;
            }
             const q = query(collection(db, 'skills'), where('userId', '==', currentUser.uid), orderBy('skillName', 'asc'));
             const querySnapshot = await getDocs(q);
             const fetchedSkills = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
             setSkills(fetchedSkills);
             // Select the first skill by default if available
             if (fetchedSkills.length > 0) {
                 setSelectedSkill(fetchedSkills[0].skillName);
             } else {
                 setSelectedSkill(''); // Reset if no skills
             }
        };
        fetchSkills();
    }, [currentUser]); // Depend on currentUser

    const addNewSkill = async () => {
        if (newSkillName.trim() === '' || !currentUser) return;

        // Check if skill already exists
        const skillExists = skills.some(skill => skill.skillName.toLowerCase() === newSkillName.trim().toLowerCase());
        if (skillExists) {
            alert('This skill already exists!');
            setNewSkillName('');
            return;
        }

        console.log("Attempting to add new skill with user ID:", currentUser.uid);
        await addDoc(collection(db, 'skills'), {
            skillName: newSkillName.trim(),
            userId: currentUser.uid,
            createdAt: serverTimestamp(),
        });
        setNewSkillName('');

        // Re-fetch skills after adding
        const q = query(collection(db, 'skills'), where('userId', '==', currentUser.uid), orderBy('skillName', 'asc'));
        const querySnapshot = await getDocs(q);
        const fetchedSkills = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setSkills(fetchedSkills);
         if (fetchedSkills.length > 0 && !selectedSkill) {
             setSelectedSkill(fetchedSkills[0].skillName);
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
        // Re-fetch logs after adding
        const q = query(collection(db, 'skillLogs'), where('userId', '==', currentUser.uid), orderBy('timestamp', 'desc'));
        const querySnapshot = await getDocs(q);
        setLogs(querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    };

    const updateLog = async (id) => {
        if (editSkill.trim() === '' || editHours === '' || !currentUser) return;
         const hoursNum = parseFloat(editHours);
        if (isNaN(hoursNum) || hoursNum <= 0) {
            alert('Please enter a valid number of hours.');
            return;
        }
        console.log("Attempting to update skill log with user ID:", currentUser.uid);
        const logRef = doc(db, 'skillLogs', id);
        await updateDoc(logRef, { skill: editSkill, hours: hoursNum });
        setEditingLog(null);
        setEditSkill('');
        setEditHours('');
        // Re-fetch logs after updating
        const q = query(collection(db, 'skillLogs'), where('userId', '==', currentUser.uid), orderBy('timestamp', 'desc'));
        const querySnapshot = await getDocs(q);
        setLogs(querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    };

    const deleteLog = async (id) => {
        if (!currentUser) return;
        console.log("Attempting to delete skill log with user ID:", currentUser.uid);
        await deleteDoc(doc(db, 'skillLogs', id));
        // Update state locally
        setLogs(logs.filter(log => log.id !== id));
    };

    // Calculate total time per skill (using logs state)
    const totalTimePerSkill = logs.reduce((acc, log) => {
        acc[log.skill] = (acc[log.skill] || 0) + log.hours;
        return acc;
    }, {});


    return (
        <div className="p-4">
            <h3 className="text-xl font-semibold mb-4">Skill Hours Log</h3>

             {/* Add New Skill */}
            <div className="mb-6 p-4 bg-white rounded-md shadow-md">
                <h4 className="text-lg font-medium mb-3">Add New Skill</h4>
                <div className="flex flex-col sm:flex-row gap-4">
                    <div className="flex-grow">
                         <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="newSkill">
                            New Skill Name
                        </label>
                        <input
                            type="text"
                            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                            placeholder="Enter new skill name"
                            value={newSkillName}
                            onChange={(e) => setNewSkillName(e.target.value)}
                        />
                    </div>
                     <button
                        className="bg-purple-500 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline self-end"
                        onClick={addNewSkill}
                    >
                        Add Skill
                    </button>
                </div>
            </div>


            {/* Log Skill Time */}
            <div className="mb-6 p-4 bg-white rounded-md shadow-md">
                <h4 className="text-lg font-medium mb-3">Log Time for Existing Skill</h4>
                <div className="flex flex-col sm:flex-row gap-4">
                    <div className="flex-grow">
                         <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="selectSkill">
                            Select Skill
                        </label>
                        <select
                            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                            value={selectedSkill}
                            onChange={(e) => setSelectedSkill(e.target.value)}
                            disabled={skills.length === 0} // Disable if no skills are added yet
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
                    <div>
                        <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="hours">
                            Hours
                        </label>
                        <input
                            type="number"
                            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                            placeholder="Hours"
                            value={hours}
                            onChange={(e) => setHours(e.target.value)}
                            min="0.1"
                            step="0.1"
                            disabled={skills.length === 0} // Disable if no skills are added yet
                        />
                    </div>
                    <button
                        className={`font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline self-end ${skills.length === 0 ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-500 hover:bg-blue-700 text-white'}`}
                        onClick={addLog}
                        disabled={skills.length === 0} // Disable if no skills are added yet
                    >
                        Log Time
                    </button>
                </div>
            </div>

            {/* Total Time per Skill */}
            <div className="mb-6 p-4 bg-white rounded-md shadow-md">
                 <h4 className="text-lg font-medium mb-3">Total Time per Skill</h4>
                <ul>
                    {Object.entries(totalTimePerSkill).map(([skill, totalHours]) => (
                        <li key={skill} className="mb-1 text-gray-700">
                            <strong>{skill}:</strong> {totalHours.toFixed(1)} hours
                        </li>
                    ))}
                </ul>
            </div>


            {/* Log History */}
            <div className="p-4 bg-white rounded-md shadow-md">
                <h4 className="text-lg font-medium mb-3">Log History</h4>
                 <ul>
                    {logs.map(log => (
                        <li key={log.id} className="bg-gray-100 p-3 rounded-md mb-2 flex justify-between items-center">
                            {editingLog === log.id ? (
                                <div className="flex-grow flex flex-col sm:flex-row gap-2 mr-2">
                                     {/* When editing, allow changing skill or select from existing */}
                                     <input
                                        type="text"
                                        className="shadow appearance-none border rounded py-1 px-2 text-gray-700 leading-tight focus:outline-none focus:shadow-outline flex-grow"
                                        value={editSkill}
                                        onChange={(e) => setEditSkill(e.target.value)}
                                        placeholder="Skill"
                                    />
                                     <input
                                        type="number"
                                        className="shadow appearance-none border rounded py-1 px-2 text-gray-700 leading-tight focus:outline-none focus:shadow-outline w-20"
                                        value={editHours}
                                        onChange={(e) => setEditHours(e.target.value)}
                                        min="0.1"
                                        step="0.1"
                                        placeholder="Hours"
                                    />
                                </div>
                            ) : (
                                <span className="flex-grow">
                                    <strong>{log.skill}:</strong> {log.hours} hours - {log.timestamp?.toDate().toLocaleString()}
                                </span>
                            )}
                            <div>
                                {editingLog === log.id ? (
                                    <button
                                        className="bg-blue-500 hover:bg-blue-700 text-white text-sm py-1 px-2 rounded mr-2"
                                        onClick={() => updateLog(log.id)}
                                    >
                                        Save
                                    </button>
                                ) : (
                                    <button
                                        className="bg-yellow-500 hover:bg-yellow-700 text-white text-sm py-1 px-2 rounded mr-2"
                                        onClick={() => { setEditingLog(log.id); setEditSkill(log.skill); setEditHours(log.hours.toString()); }}
                                    >
                                        Edit
                                    </button>
                                )}
                                <button
                                    className="bg-red-500 hover:bg-red-700 text-white text-sm py-1 px-2 rounded"
                                    onClick={() => deleteLog(log.id)}
                                >
                                    Delete
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
             // Added check for currentUser
            if (!currentUser) {
                console.log("PersonalBrandFeed: No user logged in, skipping fetch.");
                return;
            }
            const q = query(collection(db, 'brandFeed'), where('userId', '==', currentUser.uid), orderBy('createdAt', 'desc'));
            const querySnapshot = await getDocs(q);
            setFeedItems(querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        };
        fetchFeed();
    }, [currentUser]); // Depend on currentUser

    const addItem = async () => {
        if (newItem.trim() === '' || !currentUser) return;
        console.log("Attempting to add brand feed item with user ID:", currentUser.uid); // Added log
        await addDoc(collection(db, 'brandFeed'), {
            text: newItem,
            userId: currentUser.uid,
            createdAt: serverTimestamp(),
        });
        setNewItem('');
        // Re-fetch or update state locally
        const q = query(collection(db, 'brandFeed'), where('userId', '==', currentUser.uid), orderBy('createdAt', 'desc'));
        const querySnapshot = await getDocs(q);
        setFeedItems(querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    };

    const updateItem = async (id) => {
        if (editText.trim() === '' || !currentUser) return; // Added currentUser check
        console.log("Attempting to update brand feed item with user ID:", currentUser.uid); // Added log
        const itemRef = doc(db, 'brandFeed', id);
        await updateDoc(itemRef, { text: editText });
        setEditingItem(null);
        setEditText('');
        // Re-fetch or update state locally
        const q = query(collection(db, 'brandFeed'), where('userId', '==', currentUser.uid), orderBy('createdAt', 'desc'));
        const querySnapshot = await getDocs(q);
        setFeedItems(querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    };

    const deleteItem = async (id) => {
        if (!currentUser) return; // Added currentUser check
        console.log("Attempting to delete brand feed item with user ID:", currentUser.uid); // Added log
        await deleteDoc(doc(db, 'brandFeed', id));
        // Update state locally
        setFeedItems(feedItems.filter(item => item.id !== id));
    };
    return (
        <div className="p-4">
            <h3 className="text-xl font-semibold mb-4">Personal Brand Feed</h3>
            <div className="mb-4 flex">
                <input
                    type="text"
                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline mr-2"
                    placeholder="Add a personal brand note or idea"
                    value={newItem}
                    onChange={(e) => setNewItem(e.target.value)}
                />
                 <button
                    className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
                    onClick={addItem}
                >
                    Add
                </button>
            </div>
             <ul>
                {feedItems.map(item => (
                    <li key={item.id} className="bg-gray-100 p-3 rounded-md mb-2 flex justify-between items-center">
                         {editingItem === item.id ? (
                            <input
                                type="text"
                                className="shadow appearance-none border rounded py-1 px-2 text-gray-700 leading-tight focus:outline-none focus:shadow-outline mr-2 flex-grow"
                                value={editText}
                                onChange={(e) => setEditText(e.target.value)}
                            />
                        ) : (
                            <span className="flex-grow">{item.text}</span>
                        )}
                        <div>
                             {editingItem === item.id ? (
                                <button
                                    className="bg-blue-500 hover:bg-blue-700 text-white text-sm py-1 px-2 rounded mr-2"
                                    onClick={() => updateItem(item.id)}
                                >
                                    Save
                                </button>
                            ) : (
                                <button
                                    className="bg-yellow-500 hover:bg-yellow-700 text-white text-sm py-1 px-2 rounded mr-2"
                                    onClick={() => { setEditingItem(item.id); setEditText(item.text); }}
                                >
                                    Edit
                                </button>
                            )}
                            <button
                                className="bg-red-500 hover:bg-red-700 text-white text-sm py-1 px-2 rounded"
                                onClick={() => deleteItem(item.id)}
                            >
                                Delete
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
        <div className="p-4">
            <h3 className="text-xl font-semibold mb-4">MVP Test Launcher</h3>
            <p>This section is for launching MVP tests. Implementation details would depend on the nature of the tests.</p>
            {/* Placeholder for MVP Test Launcher functionality */}
        </div>
    );
};

const Finance = () => {
     const { currentUser } = useAuth();
    const [transactions, setTransactions] = useState([]);
    const [description, setDescription] = useState('');
    const [amount, setAmount] = useState('');
    const [type, setType] = useState('expense'); // 'income' or 'expense'
    const [editingTransaction, setEditingTransaction] = useState(null);
    const [editDescription, setEditDescription] = useState('');
    const [editAmount, setEditAmount] = useState('');
    const [editType, setEditType] = useState('');


    useEffect(() => {
        const fetchTransactions = async () => {
             // Added check for currentUser
            if (!currentUser) {
                console.log("Finance: No user logged in, skipping fetch.");
                return;
            }
            const q = query(collection(db, 'finance'), where('userId', '==', currentUser.uid), orderBy('timestamp', 'desc'));
            const querySnapshot = await getDocs(q);
            setTransactions(querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        };
        fetchTransactions();
    }, [currentUser]); // Depend on currentUser

    const addTransaction = async () => {
        if (description.trim() === '' || amount === '' || !currentUser) return;
        const amountNum = parseFloat(amount);
         if (isNaN(amountNum) || amountNum <= 0) {
            alert('Please enter a valid amount.');
            return;
        }
        console.log("Attempting to add finance transaction with user ID:", currentUser.uid); // Added log
        await addDoc(collection(db, 'finance'), {
            description: description,
            amount: amountNum,
            type: type,
            userId: currentUser.uid,
            timestamp: serverTimestamp(),
        });
        setDescription('');
        setAmount('');
        setType('expense');
        // Re-fetch or update state locally
         const q = query(collection(db, 'finance'), where('userId', '==', currentUser.uid), orderBy('timestamp', 'desc'));
        const querySnapshot = await getDocs(q);
        setTransactions(querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    };

    const updateTransaction = async (id) => {
         if (editDescription.trim() === '' || editAmount === '' || editType.trim() === '' || !currentUser) return; // Added currentUser check
         const amountNum = parseFloat(editAmount);
         if (isNaN(amountNum) || amountNum <= 0) {
            alert('Please enter a valid amount.');
            return;
        }
        console.log("Attempting to update finance transaction with user ID:", currentUser.uid); // Added log
        const transactionRef = doc(db, 'finance', id);
        await updateDoc(transactionRef, { description: editDescription, amount: amountNum, type: editType });
        setEditingTransaction(null);
        setEditDescription('');
        setEditAmount('');
        setEditType('');
        // Re-fetch or update state locally
         const q = query(collection(db, 'finance'), where('userId', '==', currentUser.uid), orderBy('timestamp', 'desc'));
        const querySnapshot = await getDocs(q);
        setTransactions(querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    };

    const deleteTransaction = async (id) => {
        if (!currentUser) return; // Added currentUser check
        console.log("Attempting to delete finance transaction with user ID:", currentUser.uid); // Added log
        await deleteDoc(doc(db, 'finance', id));
        // Update state locally
        setTransactions(transactions.filter(transaction => transaction.id !== id));
    };

    // Calculate summary
    const totalIncome = transactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
    const totalExpense = transactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
    const netBalance = totalIncome - totalExpense;


    return (
        <div className="p-4">
            <h3 className="text-xl font-semibold mb-4">Income/Expense</h3>

            {/* Add Transaction */}
            <div className="mb-6 p-4 bg-white rounded-md shadow-md">
                <h4 className="text-lg font-medium mb-3">Add Transaction</h4>
                 <div className="flex flex-col sm:flex-row gap-4">
                    <div className="flex-grow">
                        <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="description">
                            Description
                        </label>
                        <input
                            type="text"
                            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                            placeholder="Description"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                        />
                    </div>
                    <div>
                        <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="amount">
                            Amount
                        </label>
                        <input
                            type="number"
                            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                            placeholder="Amount"
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            min="0.01"
                            step="0.01"
                        />
                    </div>
                    <div>
                         <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="type">
                            Type
                        </label>
                        <select
                            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                            value={type}
                            onChange={(e) => setType(e.target.value)}
                        >
                            <option value="income">Income</option>
                            <option value="expense">Expense</option>
                        </select>
                    </div>
                     <button
                        className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline self-end"
                        onClick={addTransaction}
                    >
                        Add Transaction
                    </button>
                </div>
            </div>

            {/* Summary */}
            <div className="mb-6 p-4 bg-white rounded-md shadow-md">
                 <h4 className="text-lg font-medium mb-3">Summary</h4>
                <p><strong>Total Income:</strong> ${totalIncome.toFixed(2)}</p>
                <p><strong>Total Expense:</strong> ${totalExpense.toFixed(2)}</p>
                <p><strong>Net Balance:</strong> ${netBalance.toFixed(2)}</p>
            </div>

            {/* Transaction History */}
            <div className="p-4 bg-white rounded-md shadow-md">
                <h4 className="text-lg font-medium mb-3">Transaction History</h4>
                 <ul>
                    {transactions.map(transaction => (
                        <li key={transaction.id} className="bg-gray-100 p-3 rounded-md mb-2 flex justify-between items-center">
                             {editingTransaction === transaction.id ? (
                                <div className="flex-grow flex flex-col sm:flex-row gap-2 mr-2">
                                    <input
                                        type="text"
                                        className="shadow appearance-none border rounded py-1 px-2 text-gray-700 leading-tight focus:outline-none focus:shadow-outline flex-grow"
                                        value={editDescription}
                                        onChange={(e) => setEditDescription(e.target.value)}
                                        placeholder="Description"
                                    />
                                     <input
                                        type="number"
                                        className="shadow appearance-none border rounded py-1 px-2 text-gray-700 leading-tight focus:outline-none focus:shadow-outline w-20"
                                        value={editAmount}
                                        onChange={(e) => setEditAmount(e.target.value)}
                                        min="0.01"
                                        step="0.01"
                                        placeholder="Amount"
                                    />
                                     <select
                                        className="shadow appearance-none border rounded py-1 px-2 text-gray-700 leading-tight focus:outline-none focus:shadow-outline w-24"
                                        value={editType}
                                        onChange={(e) => setEditType(e.target.value)}
                                    >
                                        <option value="income">Income</option>
                                        <option value="expense">Expense</option>
                                    </select>
                                </div>
                             ) : (
                                <span className={`flex-grow ${transaction.type === 'expense' ? 'text-red-600' : 'text-green-600'}`}>
                                    {transaction.description}: ${transaction.amount.toFixed(2)} ({transaction.type}) - {transaction.timestamp?.toDate().toLocaleString()}
                                </span>
                            )}
                            <div>
                                {editingTransaction === transaction.id ? (
                                    <button
                                        className="bg-blue-500 hover:bg-blue-700 text-white text-sm py-1 px-2 rounded mr-2"
                                        onClick={() => updateTransaction(transaction.id)}
                                    >
                                        Save
                                    </button>
                                ) : (
                                    <button
                                        className="bg-yellow-500 hover:bg-yellow-700 text-white text-sm py-1 px-2 rounded mr-2"
                                        onClick={() => { setEditingTransaction(transaction.id); setEditDescription(transaction.description); setEditAmount(transaction.amount.toString()); setEditType(transaction.type); }}
                                    >
                                        Edit
                                    </button>
                                )}
                                <button
                                    className="bg-red-500 hover:bg-red-700 text-white text-sm py-1 px-2 rounded"
                                    onClick={() => deleteTransaction(transaction.id)}
                                >
                                    Delete
                                </button>
                            </div>
                        </li>
                    ))}
                </ul>
            </div>
        </div>
    );
};


// --- Dashboard Component (Authenticated View) ---

const Dashboard = () => {
  const { currentUser, logout } = useAuth();
  const [activeTab, setActiveTab] = useState('roadmap'); // State to manage active tab

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
    <div className="min-h-screen bg-gray-100">
      <header className="bg-white shadow-sm py-4 px-6 flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-800">Mentoro</h1>
        <div className="flex items-center">
          <span className="mr-4 text-gray-700">Welcome, {currentUser?.email}</span>
          <button
            className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
            onClick={logout}
          >
            Logout
          </button>
        </div>
      </header>
      <div className="container mx-auto p-4">
        {/* Navigation Tabs */}
        <div className="mb-6 border-b border-gray-200">
          <nav className="-mb-px flex space-x-8" aria-label="Tabs">
            <button
              className={`${activeTab === 'roadmap' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'} whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
              onClick={() => setActiveTab('roadmap')}
            >
              Roadmap
            </button>
             <button
              className={`${activeTab === 'weeklyActions' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'} whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
              onClick={() => setActiveTab('weeklyActions')}
            >
              Weekly Actions
            </button>
             <button
              className={`${activeTab === 'dailyHabits' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'} whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
              onClick={() => setActiveTab('dailyHabits')}
            >
              Daily Habits
            </button>
             <button
              className={`${activeTab === 'skillLog' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'} whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
              onClick={() => setActiveTab('skillLog')}
            >
              Skill Hours Log
            </button>
             <button
              className={`${activeTab === 'brandFeed' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'} whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
              onClick={() => setActiveTab('brandFeed')}
            >
              Personal Brand Feed
            </button>
             <button
              className={`${activeTab === 'mvpTestLauncher' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'} whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
              onClick={() => setActiveTab('mvpTestLauncher')}
            >
              MVP Test Launcher
            </button>
             <button
              className={`${activeTab === 'finance' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'} whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
              onClick={() => setActiveTab('finance')}
            >
              Finance
            </button>
          </nav>
        </div>

        {/* Content based on active tab */}
        {renderContent()}
      </div>
    </div>
  );
};


// --- Main App Component ---
const App = () => {
  // Removed useAuth() from here

  return (
    <AuthProvider>
      <div className="App">
        {/* Include Tailwind CSS - In a real project, configure this properly */}
        <link href="https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css" rel="stylesheet" />
         {/* Apply Inter font */}
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap" rel="stylesheet" />
        <style>
          {`
          body {
            font-family: 'Inter', sans-serif;
          }
          /* Basic rounded corners for common elements */
          .rounded, .rounded-md, .rounded-lg, .rounded-xl {
            border-radius: 0.375rem; /* Default Tailwind rounded-md */
          }
          input, button, select, .bg-white, .bg-gray-100 {
             border-radius: 0.375rem; /* Apply rounded corners */
          }
          `}
        </style>

        {/* Render Auth component if not logged in, else render Dashboard */}
        {/* The components below will now have access to AuthContext via useAuth() */}
        <AuthWrapper />
      </div>
    </AuthProvider>
  );
};

// Helper component to use useAuth inside AuthProvider
const AuthWrapper = () => {
    const { currentUser } = useAuth();
    return currentUser ? <Dashboard /> : <Auth />;
}


export default App;
