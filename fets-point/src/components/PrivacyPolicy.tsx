import React from 'react';

export const PrivacyPolicy: React.FC = () => {
    return (
        <div className="min-h-screen bg-gray-50 text-gray-900 py-12 px-4 sm:px-6 lg:px-8 font-sans">
            <div className="max-w-4xl mx-auto bg-white p-8 md:p-12 rounded-2xl shadow-sm border border-gray-100">
                <h1 className="text-4xl font-bold mb-8 text-gray-900 border-b pb-4">Privacy Policy for FETS.LIVE</h1>

                <div className="space-y-6 text-gray-700 leading-relaxed">
                    <section>
                        <p className="font-semibold text-gray-500 mb-2">Effective Date: {new Date().toLocaleDateString()}</p>
                        <p>
                            Welcome to the FETS.LIVE application and website ("Service"). This Privacy Policy is meant to help you understand what information we collect, why we collect it, and how you can update, manage, export, and delete your information. This policy is compatible with Google Play's Developer Policy regarding privacy and user data.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-semibold mt-8 mb-4 text-gray-900">1. Information We Collect</h2>
                        <p className="mb-3">We collect information to provide better services to all our users. The types of information we collect include:</p>
                        <ul className="list-disc pl-6 space-y-2">
                            <li><strong>Account Information:</strong> When you create an account, we collect personal information such as your name, email address, password, and phone number.</li>
                            <li><strong>Device Information:</strong> We may collect device-specific information (such as your hardware model, operating system version, unique device identifiers, and mobile network information).</li>
                            <li><strong>Log Data:</strong> When you use our Service, we automatically collect certain information such as your IP address, browser type, operating system, the referring web page, pages visited, location, your mobile carrier, device and application IDs, and search terms.</li>
                            <li><strong>Camera and Photos:</strong> Our app may require access to your device's camera and photo library for uploading context and checklists required for app functionality.</li>
                            <li><strong>Push Notifications:</strong> We may request to send you push notifications regarding your account or the Application. If you wish to opt-out from receiving these types of communications, you may turn them off in your device's settings.</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-2xl font-semibold mt-8 mb-4 text-gray-900">2. How We Use Information</h2>
                        <p className="mb-3">We use the information we collect from all our services to provide, maintain, protect, and improve them, to develop new ones, and to protect FETS.LIVE and our users. Specifically, we use your information to:</p>
                        <ul className="list-disc pl-6 space-y-2">
                            <li>Provide, operate, and maintain our Service.</li>
                            <li>Improve, personalize, and expand our Service.</li>
                            <li>Understand and analyze how you use our Service.</li>
                            <li>Develop new products, services, features, and functionality.</li>
                            <li>Communicate with you, either directly or through one of our partners, including for customer service, to provide you with updates and other information relating to the Service, and for marketing and promotional purposes.</li>
                            <li>Send you push notifications and emails.</li>
                            <li>Find and prevent fraud.</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-2xl font-semibold mt-8 mb-4 text-gray-900">3. Third-Party Services</h2>
                        <p>
                            We may employ third-party companies and individuals due to the following reasons:
                        </p>
                        <ul className="list-disc pl-6 mt-2 mb-3 space-y-2">
                            <li>To facilitate our Service;</li>
                            <li>To provide the Service on our behalf;</li>
                            <li>To perform Service-related services; or</li>
                            <li>To assist us in analyzing how our Service is used.</li>
                        </ul>
                        <p>
                            These third parties may have access to your Personal Information to perform these tasks on our behalf and are obligated not to disclose or use it for any other purpose. (e.g., Supabase for database management and authentication).
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-semibold mt-8 mb-4 text-gray-900">4. Security</h2>
                        <p>
                            We value your trust in providing us your Personal Information, thus we are striving to use commercially acceptable means of protecting it. But remember that no method of transmission over the internet, or method of electronic storage is 100% secure and reliable, and we cannot guarantee its absolute security.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-semibold mt-8 mb-4 text-gray-900">5. Links to Other Sites</h2>
                        <p>
                            This Service may contain links to other sites. If you click on a third-party link, you will be directed to that site. Note that these external sites are not operated by us. Therefore, we strongly advise you to review the Privacy Policy of these websites. We have no control over and assume no responsibility for the content, privacy policies, or practices of any third-party sites or services.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-semibold mt-8 mb-4 text-gray-900">6. Children's Privacy</h2>
                        <p>
                            These Services do not address anyone under the age of 13. We do not knowingly collect personally identifiable information from children under 13. In the case we discover that a child under 13 has provided us with personal information, we immediately delete this from our servers. If you are a parent or guardian and you are aware that your child has provided us with personal information, please contact us so that we will be able to do necessary actions.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-semibold mt-8 mb-4 text-gray-900">7. Changes to This Privacy Policy</h2>
                        <p>
                            We may update our Privacy Policy from time to time. Thus, you are advised to review this page periodically for any changes. We will notify you of any changes by posting the new Privacy Policy on this page. These changes are effective immediately after they are posted on this page.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-semibold mt-8 mb-4 text-gray-900">8. Contact Us</h2>
                        <p>
                            If you have any questions or suggestions about our Privacy Policy, do not hesitate to contact us at <strong>support@fets.live</strong> or through the platform.
                        </p>
                    </section>
                </div>

                <div className="mt-12 pt-6 border-t border-gray-100 flex justify-between items-center text-sm text-gray-500">
                    <span>&copy; {new Date().getFullYear()} FETS.LIVE. All rights reserved.</span>
                    <a href="/" className="text-[#F6C845] hover:text-yellow-600 font-medium transition-colors">Return to Home</a>
                </div>
            </div>
        </div>
    );
};

export default PrivacyPolicy;
