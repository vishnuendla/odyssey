import React from 'react';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Shield, Eye, Lock, Database, UserCheck, Globe } from 'lucide-react';

const PrivacyPolicy = () => {
  const lastUpdated = "September 15, 2025";

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="flex justify-center mb-4">
              <Shield className="h-12 w-12 text-primary" />
            </div>
            <h1 className="text-3xl font-bold mb-2">Privacy Policy</h1>
            <p className="text-muted-foreground">Last updated: {lastUpdated}</p>
          </div>

          <div className="space-y-6">
            {/* Introduction */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-3">
                  <Eye className="h-5 w-5 text-primary" />
                  Introduction
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground leading-relaxed">
                  At Odyssey, we take your privacy seriously. This Privacy Policy explains how we collect, 
                  use, disclose, and safeguard your information when you use our travel journaling platform. 
                  We are committed to protecting your personal information and your right to privacy.
                </p>
              </CardContent>
            </Card>

            {/* Information We Collect */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-3">
                  <Database className="h-5 w-5 text-primary" />
                  Information We Collect
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <h4 className="font-semibold mb-2">Personal Information</h4>
                    <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                      <li>Name and email address when you create an account</li>
                      <li>Profile information you choose to provide</li>
                      <li>Travel journal content, photos, and location data</li>
                      <li>Communication preferences and settings</li>
                    </ul>
                  </div>
                  
                  <div>
                    <h4 className="font-semibold mb-2">Usage Information</h4>
                    <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                      <li>How you interact with our platform</li>
                      <li>Device information and browser type</li>
                      <li>IP address and general location data</li>
                      <li>Cookies and similar tracking technologies</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* How We Use Your Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-3">
                  <UserCheck className="h-5 w-5 text-primary" />
                  How We Use Your Information
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="list-disc list-inside text-sm text-muted-foreground space-y-2">
                  <li>Provide and maintain our travel journaling services</li>
                  <li>Personalize your experience and improve our platform</li>
                  <li>Communicate with you about your account and our services</li>
                  <li>Display your public journal entries to other users (only if you choose to make them public)</li>
                  <li>Ensure platform security and prevent fraudulent activity</li>
                  <li>Comply with legal obligations and resolve disputes</li>
                </ul>
              </CardContent>
            </Card>

            {/* Information Sharing */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-3">
                  <Globe className="h-5 w-5 text-primary" />
                  Information Sharing and Disclosure
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <p className="text-muted-foreground text-sm">
                    We do not sell, trade, or rent your personal information to third parties. 
                    We may share your information only in the following circumstances:
                  </p>
                  
                  <ul className="list-disc list-inside text-sm text-muted-foreground space-y-2">
                    <li><strong>Public Content:</strong> Journal entries you mark as "public" will be visible to other users</li>
                    <li><strong>Service Providers:</strong> With trusted third-party services that help us operate our platform</li>
                    <li><strong>Legal Requirements:</strong> When required by law or to protect our rights and safety</li>
                    <li><strong>Business Transfers:</strong> In connection with a merger, sale, or acquisition of our business</li>
                    <li><strong>Consent:</strong> With your explicit consent for specific purposes</li>
                  </ul>
                </div>
              </CardContent>
            </Card>

            {/* Data Security */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-3">
                  <Lock className="h-5 w-5 text-primary" />
                  Data Security
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <p className="text-muted-foreground text-sm">
                    We implement appropriate technical and organizational security measures to protect your 
                    personal information against unauthorized access, alteration, disclosure, or destruction.
                  </p>
                  
                  <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                    <li>Encryption of data in transit and at rest</li>
                    <li>Regular security assessments and updates</li>
                    <li>Access controls and authentication requirements</li>
                    <li>Secure data storage and backup procedures</li>
                  </ul>
                </div>
              </CardContent>
            </Card>

            {/* Your Rights */}
            <Card>
              <CardHeader>
                <CardTitle>Your Privacy Rights</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <p className="text-muted-foreground text-sm">
                    You have the following rights regarding your personal information:
                  </p>
                  
                  <ul className="list-disc list-inside text-sm text-muted-foreground space-y-2">
                    <li><strong>Access:</strong> Request access to your personal information</li>
                    <li><strong>Correction:</strong> Request correction of inaccurate or incomplete data</li>
                    <li><strong>Deletion:</strong> Request deletion of your personal information</li>
                    <li><strong>Portability:</strong> Request a copy of your data in a portable format</li>
                    <li><strong>Objection:</strong> Object to processing of your personal information</li>
                    <li><strong>Restriction:</strong> Request restriction of processing</li>
                  </ul>
                  
                  <p className="text-muted-foreground text-sm mt-4">
                    To exercise these rights, please contact us at privacy@odysseyjournal.com
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Cookies */}
            <Card>
              <CardHeader>
                <CardTitle>Cookies and Tracking</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  We use cookies and similar tracking technologies to enhance your experience on our platform. 
                  You can control cookie settings through your browser preferences. Note that disabling cookies 
                  may affect the functionality of certain features.
                </p>
              </CardContent>
            </Card>


            {/* Changes to Policy */}
            <Card>
              <CardHeader>
                <CardTitle>Changes to This Privacy Policy</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  We may update this Privacy Policy from time to time. We will notify you of any changes 
                  by posting the new Privacy Policy on this page and updating the "Last updated" date. 
                  We encourage you to review this Privacy Policy periodically.
                </p>
              </CardContent>
            </Card>

            {/* Contact */}
            <Card>
              <CardHeader>
                <CardTitle>Contact Us</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  If you have any questions about this Privacy Policy or our privacy practices, 
                  please contact us at:
                </p>
                <div className="mt-4 text-sm">
                  <p>Email: Sakethdussa1234@gmail.com</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
      
      <Footer />
    </div>
  );
};

export default PrivacyPolicy;