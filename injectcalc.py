f = open('src/EmaarDashboardV2.jsx', 'r', encoding='utf-8')
c = f.read()
f.close()

calc = """
              {/* ROI Calculator */}
              {(() => {
                const roi = communityROI[selectedProject_.community];
                if (!roi) return null;
                return (
                  <ProGate isPro={isPro} message="Unlock ROI Calculator" onUpgrade={() => setShowUpgrade(true)}>
                  <RoiCalculator project={selectedProject_} roi={roi} T={T} />
                  </ProGate>
                );
              })()}

"""

c = c.replace('              {/* Contact CTAs */}', calc + '              {/* Contact CTAs */}')
f = open('src/EmaarDashboardV2.jsx', 'w', encoding='utf-8')
f.write(c)
f.close()
print('Injected!')
