import React from 'react';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Scale, FileText, AlertTriangle, CheckCircle, XCircle, Gavel } from 'lucide-react';

const TermsOfService = () => {
  const lastUpdated = "September 15, 2025";

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="flex justify-center mb-4">
              <Scale className="h-12 w-12 text-primary" />
            </div>
            <h1 className="text-3xl font-bold mb-2">Terms of Service</h1>
            <p className="text-muted-foreground">Last updated: {lastUpdated}</p>
          </div>

          <div className="space-y-6">
            {/* Introduction */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-3">
                  <FileText className="h-5 w-5 text-primary" />
                  Agreement to Terms
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground leading-relaxed">
                  By accessing and using Odyssey ("Service"), you accept and agree to be bound by the terms 
                  and provision of this agreement. If you do not agree to abide by the above, please do not 
                  use this service. These Terms of Service apply to all users of the Service.
                </p>
              </CardContent>
            </Card>

            {/* Service Description */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-3">
                  <CheckCircle className="h-5 w-5 text-primary" />
                  Service Description
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground leading-relaxed mb-4">
                  Odyssey is a travel journaling platform that allows users to create, store, and share 
                  their travel experiences through journals, photos, maps, and other content. Our service 
                  includes:
                </p>
                <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                  <li>Creation and management of travel journals</li>
                  <li>Photo uploading and storage</li>
                  <li>Location mapping and geolocation services</li>
                  <li>Social sharing and community features</li>
                  <li>Timeline and exploration tools</li>
                </ul>
              </CardContent>
            </Card>

            {/* User Accounts */}
            <Card>
              <CardHeader>
                <CardTitle>User Accounts and Registration</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <p className="text-muted-foreground text-sm leading-relaxed">
                    To access certain features of our Service, you must register for an account. 
                    When you register, you agree to:
                  </p>
                  <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                    <li>Provide accurate, current, and complete information</li>
                    <li>Maintain and update your information to keep it accurate</li>
                    <li>Keep your password secure and confidential</li>
                    <li>Be responsible for all activities under your account</li>
                    <li>Notify us immediately of any unauthorized use</li>
                  </ul>
                </div>
              </CardContent>
            </Card>

            {/* Acceptable Use */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-3">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  Acceptable Use Policy
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <p className="text-muted-foreground text-sm">You may use our Service to:</p>
                  <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                    <li>Create and share personal travel journals</li>
                    <li>Upload photos and content that you own or have rights to use</li>
                    <li>Interact respectfully with other users</li>
                    <li>Explore and discover public travel content</li>
                  </ul>
                </div>
              </CardContent>
            </Card>

            {/* Prohibited Activities */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-3">
                  <XCircle className="h-5 w-5 text-red-600" />
                  Prohibited Activities
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <p className="text-muted-foreground text-sm">You may NOT use our Service to:</p>
                  <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                    <li>Upload illegal, harmful, or inappropriate content</li>
                    <li>Violate any laws or regulations</li>
                    <li>Infringe on others' intellectual property rights</li>
                    <li>Harass, threaten, or abuse other users</li>
                    <li>Distribute spam, malware, or harmful code</li>
                    <li>Attempt to gain unauthorized access to our systems</li>
                    <li>Use automated tools to access or scrape our Service</li>
                    <li>Impersonate others or provide false information</li>
                  </ul>
                </div>
              </CardContent>
            </Card>

            {/* Content and Intellectual Property */}
            <Card>
              <CardHeader>
                <CardTitle>Content and Intellectual Property</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <h4 className="font-semibold mb-2">Your Content</h4>
                    <p className="text-muted-foreground text-sm mb-2">
                      You retain ownership of content you upload to our Service. By uploading content, you grant us:
                    </p>
                    <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                      <li>A license to store, display, and distribute your public content</li>
                      <li>The right to backup and preserve your content</li>
                      <li>Permission to optimize and format content for our platform</li>
                    </ul>
                  </div>
                  
                  <div>
                    <h4 className="font-semibold mb-2">Our Content</h4>
                    <p className="text-muted-foreground text-sm">
                      Our platform, design, code, and other intellectual property remain our exclusive property. 
                      You may not copy, modify, or redistribute our platform without permission.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Disclaimers */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-3">
                  <AlertTriangle className="h-5 w-5 text-yellow-600" />
                  Disclaimers and Limitations
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <p className="text-muted-foreground text-sm leading-relaxed">
                    Our Service is provided "as is" without warranties of any kind. We do not guarantee that:
                  </p>
                  <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                    <li>The Service will be uninterrupted or error-free</li>
                    <li>Data will be completely secure from loss or corruption</li>
                    <li>The Service will meet all your specific requirements</li>
                    <li>Third-party content or links will be accurate or safe</li>
                  </ul>
                </div>
              </CardContent>
            </Card>

            {/* Termination */}
            <Card>
              <CardHeader>
                <CardTitle>Account Termination</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <p className="text-muted-foreground text-sm leading-relaxed">
                    We may terminate or suspend your account at any time for violations of these Terms or 
                    for any other reason at our discretion. You may also delete your account at any time 
                    through your account settings.
                  </p>
                  <p className="text-muted-foreground text-sm leading-relaxed">
                    Upon termination, your right to use the Service will cease immediately, and we may 
                    delete your account and associated data.
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Liability */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-3">
                  <Gavel className="h-5 w-5 text-primary" />
                  Limitation of Liability
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  To the maximum extent permitted by law, Odyssey shall not be liable for any indirect, 
                  incidental, special, consequential, or punitive damages, including but not limited to 
                  loss of profits, data, or use, arising out of or relating to your use of the Service.
                </p>
              </CardContent>
            </Card>

            {/* Changes to Terms */}
            <Card>
              <CardHeader>
                <CardTitle>Changes to Terms</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  We reserve the right to modify these Terms at any time. We will notify users of significant 
                  changes by posting the updated Terms on our website and updating the "Last updated" date. 
                  Your continued use of the Service after changes constitutes acceptance of the new Terms.
                </p>
              </CardContent>
            </Card>

            {/* Contact */}
            <Card>
              <CardHeader>
                <CardTitle>Contact Information</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  If you have any questions about these Terms of Service, please contact us at:
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

export default TermsOfService;