'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Camera, User, Lock, Bell, Shield, Trash2, CheckCircle,
  Eye, EyeOff, MapPin, FileText, Mail, LogOut, ChevronRight,
} from 'lucide-react';
import toast from 'react-hot-toast';
import {
  updateProfile as firebaseUpdateProfile,
  updatePassword,
  reauthenticateWithCredential,
  EmailAuthProvider,
  deleteUser,
} from 'firebase/auth';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { doc, updateDoc } from 'firebase/firestore';
import { auth, storage, db } from '@/lib/firebase';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/Button';
import { Input, Textarea } from '@/components/ui/Input';
import { getInitials } from '@/lib/utils';
import Link from 'next/link';

// ─── Schemas ─────────────────────────────────────────────────────────────────
const profileSchema = z.object({
  displayName: z.string().min(2, 'Name must be at least 2 characters').max(50),
  bio: z.string().max(200, 'Bio max 200 characters').optional(),
  region: z.string().max(100).optional(),
  website: z.string().url('Enter a valid URL').optional().or(z.literal('')),
});

const passwordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string().min(6, 'Password must be at least 6 characters'),
  confirmPassword: z.string(),
}).refine((d) => d.newPassword === d.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

type ProfileData = z.infer<typeof profileSchema>;
type PasswordData = z.infer<typeof passwordSchema>;

type Tab = 'profile' | 'security' | 'account';

// ─── Avatar Upload ────────────────────────────────────────────────────────────
function AvatarSection({ user, userProfile, onUploaded }: {
  user: ReturnType<typeof useAuth>['user'];
  userProfile: ReturnType<typeof useAuth>['userProfile'];
  onUploaded: (url: string) => void;
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [preview, setPreview] = useState<string | null>(null);

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    if (!file.type.startsWith('image/')) { toast.error('Please select an image'); return; }
    if (file.size > 5 * 1024 * 1024) { toast.error('Image must be less than 5MB'); return; }

    // Show local preview instantly
    const reader = new FileReader();
    reader.onload = (ev) => setPreview(ev.target?.result as string);
    reader.readAsDataURL(file);

    setUploading(true);
    try {
      const storageRef = ref(storage, `avatars/${user.uid}/profile.${file.name.split('.').pop()}`);
      const task = uploadBytesResumable(storageRef, file);

      const url = await new Promise<string>((resolve, reject) => {
        task.on('state_changed',
          (snap) => setProgress((snap.bytesTransferred / snap.totalBytes) * 100),
          reject,
          async () => resolve(await getDownloadURL(task.snapshot.ref))
        );
      });

      // Update both Firebase Auth profile and Firestore
      if (auth.currentUser) {
        await firebaseUpdateProfile(auth.currentUser, { photoURL: url });
        await updateDoc(doc(db, 'users', user.uid), { photoURL: url });
      }
      onUploaded(url);
      toast.success('Profile photo updated!');
    } catch {
      toast.error('Upload failed. Please try again.');
      setPreview(null);
    } finally {
      setUploading(false);
      setProgress(0);
    }
  };

  const photoURL = preview || userProfile?.photoURL || user?.photoURL;

  return (
    <div className="flex flex-col sm:flex-row items-center gap-6 p-6 bg-gray-50 rounded-2xl border border-gray-100">
      <div className="relative group">
        {photoURL ? (
          <img src={photoURL} alt="Profile" className="w-24 h-24 rounded-full object-cover ring-4 ring-white shadow-md" />
        ) : (
          <div className="w-24 h-24 rounded-full bg-gradient-to-br from-primary-400 to-secondary-500 flex items-center justify-center text-white text-3xl font-bold ring-4 ring-white shadow-md">
            {getInitials(userProfile?.displayName || user?.displayName)}
          </div>
        )}
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className="absolute inset-0 rounded-full bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer"
        >
          <Camera className="w-6 h-6 text-white" />
        </button>
        <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFile} className="hidden" />
      </div>
      <div className="text-center sm:text-left">
        <h3 className="font-semibold text-gray-900">{userProfile?.displayName || 'Your Name'}</h3>
        <p className="text-sm text-gray-500 mb-3">{user?.email}</p>
        <Button
          size="sm"
          variant="secondary"
          onClick={() => fileInputRef.current?.click()}
          loading={uploading}
          icon={<Camera className="w-3.5 h-3.5" />}
        >
          {uploading ? `Uploading ${Math.round(progress)}%` : 'Change Photo'}
        </Button>
        <p className="text-xs text-gray-400 mt-1.5">JPG, PNG or GIF · Max 5MB</p>
      </div>
    </div>
  );
}

// ─── Main Settings Page ───────────────────────────────────────────────────────
export default function SettingsPage() {
  const { user, userProfile, signOut } = useAuth();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<Tab>('profile');
  const [profileSaving, setProfileSaving] = useState(false);
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [photoURL, setPhotoURL] = useState('');

  const profileForm = useForm<ProfileData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      displayName: userProfile?.displayName || '',
      bio: userProfile?.bio || '',
      region: userProfile?.region || '',
      website: userProfile?.website || '',
    },
  });

  const passwordForm = useForm<PasswordData>({ resolver: zodResolver(passwordSchema) });

  // Populate form when profile loads
  useEffect(() => {
    if (userProfile) {
      profileForm.reset({
        displayName: userProfile.displayName || '',
        bio: userProfile.bio || '',
        region: userProfile.region || '',
        website: userProfile.website || '',
      });
    }
  }, [userProfile]);

  if (!user) {
    return (
      <div className="pt-24 min-h-[60vh] flex items-center justify-center">
        <div className="text-center card p-10">
          <User className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500 mb-4">Sign in to access settings</p>
          <Link href="/join" className="btn-primary">Sign In</Link>
        </div>
      </div>
    );
  }

  const onProfileSave = async (data: ProfileData) => {
    if (!user) return;
    setProfileSaving(true);
    try {
      await firebaseUpdateProfile(auth.currentUser!, { displayName: data.displayName });
      await updateDoc(doc(db, 'users', user.uid), {
        displayName: data.displayName,
        bio: data.bio || '',
        region: data.region || '',
        website: data.website || '',
      });
      toast.success('Profile updated!');
    } catch {
      toast.error('Failed to save profile');
    } finally {
      setProfileSaving(false);
    }
  };

  const onPasswordChange = async (data: PasswordData) => {
    if (!user?.email) return;
    setPasswordSaving(true);
    try {
      const credential = EmailAuthProvider.credential(user.email, data.currentPassword);
      await reauthenticateWithCredential(user, credential);
      await updatePassword(user, data.newPassword);
      passwordForm.reset();
      toast.success('Password changed successfully!');
    } catch (err: unknown) {
      const msg = (err as {code?: string}).code;
      if (msg === 'auth/wrong-password' || msg === 'auth/invalid-credential') {
        toast.error('Current password is incorrect');
      } else {
        toast.error('Failed to change password');
      }
    } finally {
      setPasswordSaving(false);
    }
  };

  const handleDeleteAccount = async () => {
    const confirmed = window.confirm(
      'Are you absolutely sure? This will permanently delete your account and all your data. This cannot be undone.'
    );
    if (!confirmed) return;
    const confirmed2 = window.confirm('Last chance — delete your account forever?');
    if (!confirmed2) return;
    try {
      await deleteUser(user);
      toast.success('Account deleted');
      router.push('/');
    } catch {
      toast.error('You may need to sign in again before deleting your account');
    }
  };

  const tabs = [
    { key: 'profile', label: 'Profile', icon: <User className="w-4 h-4" /> },
    { key: 'security', label: 'Security', icon: <Lock className="w-4 h-4" /> },
    { key: 'account', label: 'Account', icon: <Shield className="w-4 h-4" /> },
  ] as const;

  const bioValue = profileForm.watch('bio') || '';

  return (
    <div className="pt-16 bg-surface">
      {/* Header */}
      <section className="bg-cultural-gradient border-b border-gray-100 py-12">
        <div className="page-container max-w-5xl">
          <h1 className="font-display text-4xl font-bold text-gray-900 mb-1">Account Settings</h1>
          <p className="text-gray-500">Manage your profile, security and account preferences</p>
        </div>
      </section>

      <div className="page-container max-w-5xl py-8">
        <div className="flex flex-col lg:flex-row gap-8">

          {/* Sidebar Nav */}
          <aside className="lg:w-56 shrink-0">
            <nav className="card overflow-hidden border border-gray-100">
              {tabs.map(({ key, label, icon }) => (
                <button
                  key={key}
                  onClick={() => setActiveTab(key)}
                  className={`w-full flex items-center justify-between px-4 py-3 text-sm font-medium transition-colors border-b border-gray-50 last:border-0 ${
                    activeTab === key
                      ? 'bg-primary-50 text-primary-700 border-l-3 border-l-primary-500'
                      : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  <span className="flex items-center gap-2.5">{icon} {label}</span>
                  <ChevronRight className={`w-3.5 h-3.5 transition-opacity ${activeTab === key ? 'opacity-100' : 'opacity-0'}`} />
                </button>
              ))}
              <div className="border-t border-gray-100">
                <Link
                  href={`/profile/${user.uid}`}
                  className="w-full flex items-center gap-2.5 px-4 py-3 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
                >
                  <User className="w-4 h-4" /> View Profile
                </Link>
                <button
                  onClick={() => { signOut(); router.push('/'); }}
                  className="w-full flex items-center gap-2.5 px-4 py-3 text-sm font-medium text-red-500 hover:bg-red-50 transition-colors"
                >
                  <LogOut className="w-4 h-4" /> Sign Out
                </button>
              </div>
            </nav>
          </aside>

          {/* Main Content */}
          <main className="flex-1 min-w-0">

            {/* ── Profile Tab ── */}
            {activeTab === 'profile' && (
              <div className="space-y-6">
                <div className="card p-6 border border-gray-100">
                  <h2 className="font-display font-bold text-xl text-gray-900 mb-5">Profile Photo</h2>
                  <AvatarSection user={user} userProfile={userProfile} onUploaded={setPhotoURL} />
                </div>

                <div className="card p-6 border border-gray-100">
                  <h2 className="font-display font-bold text-xl text-gray-900 mb-5">Personal Information</h2>
                  <form onSubmit={profileForm.handleSubmit(onProfileSave)} className="space-y-5">
                    <Input
                      label="Full Name"
                      placeholder="Your full name"
                      error={profileForm.formState.errors.displayName?.message}
                      {...profileForm.register('displayName')}
                    />

                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <label className="label mb-0">Bio</label>
                        <span className={`text-xs ${bioValue.length > 180 ? 'text-red-400' : 'text-gray-400'}`}>
                          {bioValue.length}/200
                        </span>
                      </div>
                      <Textarea
                        placeholder="Tell the community about yourself..."
                        rows={3}
                        error={profileForm.formState.errors.bio?.message}
                        {...profileForm.register('bio')}
                      />
                    </div>

                    <div className="grid sm:grid-cols-2 gap-4">
                      <Input
                        label="Region / City"
                        placeholder="e.g. Madurai, Chennai"
                        error={profileForm.formState.errors.region?.message}
                        {...profileForm.register('region')}
                      />
                      <Input
                        label="Website"
                        type="url"
                        placeholder="https://yourwebsite.com"
                        error={profileForm.formState.errors.website?.message}
                        {...profileForm.register('website')}
                      />
                    </div>

                    <div className="bg-gray-50 rounded-xl p-4">
                      <p className="text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">
                        <Mail className="w-4 h-4 text-gray-400" /> Email Address
                      </p>
                      <p className="text-sm text-gray-500">{user.email}</p>
                      <p className="text-xs text-gray-400 mt-0.5">Email cannot be changed here</p>
                    </div>

                    <div className="flex justify-end">
                      <Button type="submit" loading={profileSaving} icon={<CheckCircle className="w-4 h-4" />}>
                        Save Changes
                      </Button>
                    </div>
                  </form>
                </div>
              </div>
            )}

            {/* ── Security Tab ── */}
            {activeTab === 'security' && (
              <div className="space-y-6">
                <div className="card p-6 border border-gray-100">
                  <h2 className="font-display font-bold text-xl text-gray-900 mb-2">Change Password</h2>
                  <p className="text-sm text-gray-500 mb-6">
                    {user.providerData[0]?.providerId === 'google.com'
                      ? 'You signed in with Google. Password change is not available for Google accounts.'
                      : 'Choose a strong password with at least 6 characters.'}
                  </p>

                  {user.providerData[0]?.providerId !== 'google.com' ? (
                    <form onSubmit={passwordForm.handleSubmit(onPasswordChange)} className="space-y-5">
                      <div className="relative">
                        <Input
                          label="Current Password"
                          type={showCurrent ? 'text' : 'password'}
                          placeholder="Enter your current password"
                          error={passwordForm.formState.errors.currentPassword?.message}
                          {...passwordForm.register('currentPassword')}
                        />
                        <button type="button" onClick={() => setShowCurrent(!showCurrent)}
                          className="absolute right-3 top-8 text-gray-400 hover:text-gray-600">
                          {showCurrent ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                      <div className="relative">
                        <Input
                          label="New Password"
                          type={showNew ? 'text' : 'password'}
                          placeholder="Choose a new password"
                          error={passwordForm.formState.errors.newPassword?.message}
                          {...passwordForm.register('newPassword')}
                        />
                        <button type="button" onClick={() => setShowNew(!showNew)}
                          className="absolute right-3 top-8 text-gray-400 hover:text-gray-600">
                          {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                      <Input
                        label="Confirm New Password"
                        type={showNew ? 'text' : 'password'}
                        placeholder="Repeat your new password"
                        error={passwordForm.formState.errors.confirmPassword?.message}
                        {...passwordForm.register('confirmPassword')}
                      />
                      <div className="flex justify-end">
                        <Button type="submit" loading={passwordSaving} icon={<Lock className="w-4 h-4" />}>
                          Update Password
                        </Button>
                      </div>
                    </form>
                  ) : (
                    <div className="flex items-center gap-3 p-4 bg-blue-50 rounded-xl border border-blue-100">
                      <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
                        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                      </svg>
                      <div>
                        <p className="text-sm font-medium text-blue-800">Signed in with Google</p>
                        <p className="text-xs text-blue-600">Manage your password at myaccount.google.com</p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Sign-in providers info */}
                <div className="card p-6 border border-gray-100">
                  <h2 className="font-display font-bold text-xl text-gray-900 mb-4">Sign-in Methods</h2>
                  <div className="space-y-3">
                    {user.providerData.map((provider) => (
                      <div key={provider.providerId} className="flex items-center justify-between p-3 bg-green-50 rounded-xl border border-green-100">
                        <div className="flex items-center gap-3">
                          <CheckCircle className="w-4 h-4 text-green-500" />
                          <span className="text-sm font-medium text-green-800 capitalize">
                            {provider.providerId === 'google.com' ? '🔵 Google' : '📧 Email / Password'}
                          </span>
                        </div>
                        <span className="text-xs text-green-600 bg-green-100 px-2 py-0.5 rounded-full">Connected</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* ── Account Tab ── */}
            {activeTab === 'account' && (
              <div className="space-y-6">
                {/* Account info */}
                <div className="card p-6 border border-gray-100">
                  <h2 className="font-display font-bold text-xl text-gray-900 mb-4">Account Information</h2>
                  <div className="space-y-3">
                    {[
                      { label: 'Member ID', value: user.uid.slice(0, 16) + '...' },
                      { label: 'Email', value: user.email || '-' },
                      { label: 'Role', value: userProfile?.role || 'user' },
                      { label: 'Contributions', value: String(userProfile?.contributionCount || 0) },
                    ].map(({ label, value }) => (
                      <div key={label} className="flex items-center justify-between py-2.5 border-b border-gray-50 last:border-0">
                        <span className="text-sm text-gray-500">{label}</span>
                        <span className="text-sm font-medium text-gray-800 font-mono">{value}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Quick Links */}
                <div className="card p-6 border border-gray-100">
                  <h2 className="font-display font-bold text-xl text-gray-900 mb-4">Quick Links</h2>
                  <div className="space-y-2">
                    {[
                      { href: `/profile/${user.uid}`, label: 'View Public Profile', icon: <User className="w-4 h-4" /> },
                      { href: '/contribute', label: 'Contribute a Word', icon: <FileText className="w-4 h-4" /> },
                      { href: '/voice-archive', label: 'Upload Voice Recording', icon: <Bell className="w-4 h-4" /> },
                      ...(userProfile?.role === 'admin' ? [{ href: '/admin', label: 'Admin Dashboard', icon: <Shield className="w-4 h-4" /> }] : []),
                    ].map(({ href, label, icon }) => (
                      <Link key={href} href={href}
                        className="flex items-center justify-between p-3 rounded-xl hover:bg-gray-50 transition-colors group border border-transparent hover:border-gray-100">
                        <span className="flex items-center gap-3 text-sm font-medium text-gray-700">{icon} {label}</span>
                        <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-gray-500 transition-colors" />
                      </Link>
                    ))}
                  </div>
                </div>

                {/* Danger Zone */}
                <div className="card p-6 border-2 border-red-100">
                  <h2 className="font-display font-bold text-xl text-red-600 mb-2 flex items-center gap-2">
                    <Trash2 className="w-5 h-5" /> Danger Zone
                  </h2>
                  <p className="text-sm text-gray-500 mb-5">
                    Permanently delete your account. This will remove your profile and sign-in access. 
                    Your contributions (words, posts, recordings) will remain in the community archive.
                  </p>
                  <Button
                    variant="secondary"
                    onClick={handleDeleteAccount}
                    className="text-red-600 border-red-200 hover:bg-red-50"
                    icon={<Trash2 className="w-4 h-4" />}
                  >
                    Delete My Account
                  </Button>
                </div>
              </div>
            )}

          </main>
        </div>
      </div>
    </div>
  );
}
