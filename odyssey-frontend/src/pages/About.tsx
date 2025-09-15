import React from 'react';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Globe, Users, Heart, Camera, Map, Share2 } from 'lucide-react';

const About = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Hero Section */}
          <div className="text-center mb-12">
            <div className="flex justify-center mb-6">
              <Globe className="h-16 w-16 text-primary" />
            </div>
            <h1 className="text-4xl font-bold mb-4">About Odyssey</h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Your journey deserves to be remembered. We help travelers create beautiful, 
              shareable stories of their adventures around the world.
            </p>
          </div>

          {/* Mission Section */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <Heart className="h-6 w-6 text-primary" />
                Our Mission
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground leading-relaxed">
                At Odyssey, we believe that every journey tells a story worth sharing. Our platform 
                empowers travelers to document their adventures, connect with fellow explorers, and 
                inspire others to discover the beauty of our world. We're more than just a travel 
                journal app – we're a community of passionate travelers preserving memories and 
                building connections across the globe.
              </p>
            </CardContent>
          </Card>

          {/* Features Grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-3 text-lg">
                  <Camera className="h-5 w-5 text-primary" />
                  Visual Storytelling
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Combine photos, text, and locations to create rich, immersive travel stories 
                  that capture the essence of your adventures.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-3 text-lg">
                  <Map className="h-5 w-5 text-primary" />
                  Interactive Maps
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Visualize your journey with interactive maps that show where you've been 
                  and help others discover new destinations.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-3 text-lg">
                  <Share2 className="h-5 w-5 text-primary" />
                  Community Sharing
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Share your experiences with a global community of travelers and get 
                  inspired by others' incredible journeys.
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Team Section */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <Users className="h-6 w-6 text-primary" />
                Our Team
              </CardTitle>
            </CardHeader>
            <CardContent>
                <p className="text-muted-foreground leading-relaxed mb-6">
                    Odyssey was built as a mini-project by a team of four KITSW students. 
                    Our goal was to create a platform where travelers can record, organize, and share 
                    their journeys in a simple yet interactive way. This project reflects our teamwork, 
                    creativity, and hands-on learning in full-stack development.
                </p>
                <div className="grid md:grid-cols-2 gap-6">
                    <div className="text-center">
                    <div className="w-24 h-24 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Users className="h-8 w-8 text-primary" />
                    </div>
                    <h3 className="font-semibold mb-2">Our Team</h3>
                    <p className="text-sm text-muted-foreground">
                        A group of four KITSW students collaborating to bring Odyssey to life as part of our 
                        academic mini-project.
                    </p>
                    </div>
                    <div className="text-center">
                    <div className="w-24 h-24 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Globe className="h-8 w-8 text-primary" />
                    </div>
                    <h3 className="font-semibold mb-2">What We Learned</h3>
                    <p className="text-sm text-muted-foreground">
                        Hands-on experience with full-stack development, responsive design, map integration, 
                        and working as a team to solve real-world problems.
                    </p>
                    </div>
                </div>
                </CardContent>

          </Card>

          {/* Values Section */}
          <Card>
            <CardHeader>
              <CardTitle>Our Values</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-semibold mb-2">Privacy First</h4>
                  <p className="text-sm text-muted-foreground mb-4">
                    Your memories are precious. We prioritize your privacy and give you 
                    complete control over who sees your stories.
                  </p>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">Community Spirit</h4>
                  <p className="text-sm text-muted-foreground mb-4">
                    We believe in the power of shared experiences to inspire and 
                    connect travelers from all walks of life.
                  </p>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">Continuous Innovation</h4>
                  <p className="text-sm text-muted-foreground mb-4">
                    We're constantly improving our platform based on user feedback 
                    and the evolving needs of the travel community.
                  </p>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">Accessibility</h4>
                  <p className="text-sm text-muted-foreground mb-4">
                    Travel journaling should be for everyone. We work to make our 
                    platform accessible and easy to use for all travelers.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
      
      <Footer />
    </div>
  );
};

export default About;