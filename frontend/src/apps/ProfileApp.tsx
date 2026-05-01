import React, { useState } from 'react';
import { User, Mail, Phone, Building, MapPin, Save, Camera } from 'lucide-react';

const ProfileApp: React.FC = () => {
    const [profile, setProfile] = useState({
        name: 'John Doe',
        email: 'john@corridormoney.net',
        phone: '+254 712 345 678',
        company: 'Corridor Inc.',
        role: 'Admin',
        location: 'Nairobi, Kenya'
    });

    const [editing, setEditing] = useState(false);

    const handleSave = () => {
        setEditing(false);
        // TODO: Save to backend
    };

    return (
        <div className="h-full bg-[#F5F1E8] overflow-y-auto">
            <div className="max-w-3xl mx-auto p-6">
                {/* Profile Header */}
                <div className="bg-white rounded-xl border-2 border-gray-200 p-6 mb-6">
                    <div className="flex items-start gap-6">
                        <div className="relative">
                            <div className="w-24 h-24 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center text-white text-3xl font-bold">
                                {profile.name.split(' ').map(n => n[0]).join('')}
                            </div>
                            <button className="absolute bottom-0 right-0 p-2 bg-white rounded-full shadow-lg border-2 border-gray-200 hover:bg-gray-50 transition-colors">
                                <Camera className="w-4 h-4 text-gray-600" />
                            </button>
                        </div>
                        <div className="flex-1">
                            <h2 className="text-2xl font-bold text-gray-900 mb-1">{profile.name}</h2>
                            <p className="text-gray-500 mb-4">{profile.role} at {profile.company}</p>
                            <button
                                onClick={() => editing ? handleSave() : setEditing(true)}
                                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors flex items-center gap-2"
                            >
                                {editing ? (
                                    <>
                                        <Save className="w-4 h-4" />
                                        Save Changes
                                    </>
                                ) : (
                                    'Edit Profile'
                                )}
                            </button>
                        </div>
                    </div>
                </div>

                {/* Profile Details */}
                <div className="bg-white rounded-xl border-2 border-gray-200 p-6">
                    <h3 className="text-lg font-bold text-gray-900 mb-4">Personal Information</h3>
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                <User className="w-4 h-4 inline mr-2" />
                                Full Name
                            </label>
                            <input
                                type="text"
                                value={profile.name}
                                onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                                disabled={!editing}
                                className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none disabled:bg-gray-50 disabled:text-gray-500"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                <Mail className="w-4 h-4 inline mr-2" />
                                Email Address
                            </label>
                            <input
                                type="email"
                                value={profile.email}
                                onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                                disabled={!editing}
                                className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none disabled:bg-gray-50 disabled:text-gray-500"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                <Phone className="w-4 h-4 inline mr-2" />
                                Phone Number
                            </label>
                            <input
                                type="tel"
                                value={profile.phone}
                                onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                                disabled={!editing}
                                className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none disabled:bg-gray-50 disabled:text-gray-500"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                <MapPin className="w-4 h-4 inline mr-2" />
                                Location
                            </label>
                            <input
                                type="text"
                                value={profile.location}
                                onChange={(e) => setProfile({ ...profile, location: e.target.value })}
                                disabled={!editing}
                                className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none disabled:bg-gray-50 disabled:text-gray-500"
                            />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProfileApp;
