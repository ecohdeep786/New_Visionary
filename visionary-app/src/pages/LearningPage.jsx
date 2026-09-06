import React from "react";

function Logo() {
  return (
    <div className="w-[137px] h-7 relative">
      <div className="w-[29px] min-h-[21px] absolute top-0 left-0 z-[9]">
        <img className="w-[29px] h-[21px] absolute top-0 left-0 z-[1]" src="https://static.wixstatic.com/media/12d367_4f26ccd17f8f4e3a8958306ea08c2332~mv2.png" alt="Subtract" />
      </div>
      <img className="w-[5px] h-[21px] absolute top-0 left-8 z-[8]" src="https://static.wixstatic.com/media/12d367_4f26ccd17f8f4e3a8958306ea08c2332~mv2.png" alt="Vector" />
      <img className="w-[13px] h-4 absolute top-1.5 left-[39px] z-[7]" src="https://static.wixstatic.com/media/12d367_4f26ccd17f8f4e3a8958306ea08c2332~mv2.png" alt="Vector" />
      <img className="w-[5px] h-[21px] absolute top-0 left-[53px] z-[6]" src="https://static.wixstatic.com/media/12d367_4f26ccd17f8f4e3a8958306ea08c2332~mv2.png" alt="Vector" />
      <img className="w-4 h-4 absolute top-1.5 left-[60px] z-[5]" src="https://static.wixstatic.com/media/12d367_4f26ccd17f8f4e3a8958306ea08c2332~mv2.png" alt="Vector" />
      <img className="w-3.5 h-[15px] absolute top-1.5 left-[78px] z-[4]" src="https://static.wixstatic.com/media/12d367_4f26ccd17f8f4e3a8958306ea08c2332~mv2.png" alt="Vector" />
      <img className="w-3.5 h-4 absolute top-1.5 left-[94px] z-[3]" src="https://static.wixstatic.com/media/12d367_4f26ccd17f8f4e3a8958306ea08c2332~mv2.png" alt="Vector" />
      <img className="w-2.5 h-[15px] absolute top-1.5 left-[110px] z-[2]" src="https://static.wixstatic.com/media/12d367_4f26ccd17f8f4e3a8958306ea08c2332~mv2.png" alt="Vector" />
      <img className="w-4 h-[21px] absolute top-[7px] left-[121px] z-[1]" src="https://static.wixstatic.com/media/12d367_4f26ccd17f8f4e3a8958306ea08c2332~mv2.png" alt="Vector" />
    </div>
  );
}

function TopNav() {
  return (
    <div className="flex flex-row justify-between items-center px-[clamp(16px,0.7vw,39px)] min-h-[72px] bg-figma-primary shadow-[inset_0_0_0_1px_#f0f0f0] w-full shrink-0 z-20 relative">
      <div className="flex flex-row items-center gap-[clamp(16px,1.4vw,81px)]">
        <div className="w-6 h-6 flex items-center justify-center">
          <img src="https://static.wixstatic.com/media/12d367_4f26ccd17f8f4e3a8958306ea08c2332~mv2.png" alt="Menu" className="w-[18px] h-3" />
        </div>
        <Logo />
      </div>
      <div className="flex-1 max-w-[580px] mx-4">
        <div className="flex flex-row justify-between items-center px-6 h-12 bg-figma-primary rounded-[46px] shadow-[inset_0_0_0_1px_#f0f0f0] w-full">
          <span className="text-figma-14 font-normal font-figma-google-sans-flex text-figma-accent">What do you want to learn today?</span>
          <img src="https://static.wixstatic.com/media/12d367_4f26ccd17f8f4e3a8958306ea08c2332~mv2.png" alt="Search" className="w-[17px] h-[17px]" />
        </div>
      </div>
      <div className="flex flex-row items-center gap-5">
        <div className="flex flex-row items-center gap-2 py-[5px] px-[10px] bg-figma-primary rounded-[45px] shadow-[inset_0_0_0_1px_rgba(0,0,0,0.15)]">
          <img src="https://static.wixstatic.com/media/12d367_4f26ccd17f8f4e3a8958306ea08c2332~mv2.png" alt="Lang" className="w-5 h-5" />
          <span className="text-figma-14 font-medium font-figma-google-sans-flex text-figma-secondary">ENG</span>
        </div>
        <img src="https://static.wixstatic.com/media/12d367_4f26ccd17f8f4e3a8958306ea08c2332~mv2.png" alt="Notifications" className="w-4 h-5" />
        <img src="https://media.base44.com/images/public/6a411f15aad7d5c6ca250fa2/bbbd51792_84e5e9337_c9d79a389b17224b8e8200b2e454f10c950b2d2a.png" alt="Profile" className="w-[42px] h-[42px] rounded-[30px] object-cover" />
      </div>
    </div>
  );
}

function TopNavCourse() {
  return (
    <div className="flex flex-row justify-between items-center px-[clamp(16px,0.7vw,39px)] min-h-[72px] bg-figma-primary border-b border-[#dbdce0] w-full shrink-0 z-20 relative">
      <div className="flex flex-row items-center gap-[clamp(16px,1.4vw,81px)]">
        <div className="w-6 h-6 flex items-center justify-center">
          <img src="https://static.wixstatic.com/media/12d367_4f26ccd17f8f4e3a8958306ea08c2332~mv2.png" alt="Menu" className="w-[18px] h-3" />
        </div>
        <img src="https://media.base44.com/images/public/6a411f15aad7d5c6ca250fa2/c2bfa1618_b8ebba5f3_1325b96f72f59015a585d374a06afe26bb748951.png" alt="Logo" className="w-[128px] h-[26px] object-cover" />
      </div>
      <div className="flex-1 max-w-[434px] mx-4">
        <div className="flex flex-row justify-between items-center px-4 h-12 bg-figma-color-14-2 rounded-[46px] w-full">
          <span className="text-figma-16 font-normal font-paragraph text-figma-accent">What do you want to learn today?</span>
          <img src="https://static.wixstatic.com/media/12d367_4f26ccd17f8f4e3a8958306ea08c2332~mv2.png" alt="Search" className="w-[17px] h-[17px]" />
        </div>
      </div>
      <div className="flex flex-row items-center gap-5">
        <div className="flex flex-row items-center gap-2 py-[5px] px-[10px] bg-figma-primary rounded-[5px] shadow-[inset_0_0_0_1px_rgba(0,0,0,0.15)]">
          <img src="https://static.wixstatic.com/media/12d367_4f26ccd17f8f4e3a8958306ea08c2332~mv2.png" alt="Lang" className="w-5 h-5" />
          <span className="text-figma-14 font-medium font-figma-google-sans-flex text-figma-accent tracking-[-0.6px]">ENG</span>
        </div>
        <img src="https://static.wixstatic.com/media/12d367_4f26ccd17f8f4e3a8958306ea08c2332~mv2.png" alt="Notifications" className="w-4 h-5" />
        <div className="w-[42px] min-h-[42px] bg-figma-color-15-2 rounded-[30px]" />
      </div>
    </div>
  );
}

function Sidebar() {
  return (
    <div className="flex flex-col items-center gap-8 pt-[clamp(18px,1.3vw,72px)] pb-[clamp(121px,8.4vw,483px)] w-24 bg-figma-primary min-h-[888px] shrink-0 z-10 border-r border-transparent">
      <div className="flex flex-col items-center gap-1">
        <div className="flex items-center justify-center w-[46px] min-h-[46px] rounded-[51px]">
          <img src="https://static.wixstatic.com/media/12d367_4f26ccd17f8f4e3a8958306ea08c2332~mv2.png" alt="Home" className="w-[22px] h-[18px]" />
        </div>
        <span className="text-figma-14 font-medium font-paragraph text-figma-accent">Home</span>
      </div>
      <div className="flex flex-col items-center gap-1">
        <div className="flex items-center justify-center w-[46px] min-h-[46px] rounded-[51px] bg-figma-color-12 relative">
          <img src="https://static.wixstatic.com/media/12d367_4f26ccd17f8f4e3a8958306ea08c2332~mv2.png" alt="Learn" className="w-[22px] h-[17px]" />
          <img src="https://static.wixstatic.com/media/12d367_4f26ccd17f8f4e3a8958306ea08c2332~mv2.png" alt="Dot" className="w-[7px] h-[7px] absolute top-[9px] left-[25px]" />
        </div>
        <span className="text-figma-14 font-medium font-paragraph text-figma-secondary">Learn</span>
      </div>
      <div className="flex flex-col items-center gap-1">
        <div className="flex items-center justify-center w-[46px] min-h-[46px] rounded-[51px]">
          <div className="w-5 min-h-[19px] relative">
            <img src="https://static.wixstatic.com/media/12d367_4f26ccd17f8f4e3a8958306ea08c2332~mv2.png" alt="Ask" className="w-3 h-3 absolute top-0 left-2.5" />
            <img src="https://static.wixstatic.com/media/12d367_4f26ccd17f8f4e3a8958306ea08c2332~mv2.png" alt="Ask" className="w-[13px] h-3.5 absolute top-[7px] left-0" />
            <img src="https://static.wixstatic.com/media/12d367_4f26ccd17f8f4e3a8958306ea08c2332~mv2.png" alt="Ask" className="w-[5px] h-0.5 absolute top-[5px] left-[13px]" />
          </div>
        </div>
        <span className="text-figma-14 font-medium font-paragraph text-figma-accent">Ask</span>
      </div>
      <div className="flex flex-col items-center gap-1">
        <div className="flex items-center justify-center w-[46px] min-h-[46px] rounded-[51px] relative">
          <img src="https://static.wixstatic.com/media/12d367_4f26ccd17f8f4e3a8958306ea08c2332~mv2.png" alt="Practice" className="w-[22px] h-[22px] absolute top-3 left-3" />
          <img src="https://static.wixstatic.com/media/12d367_4f26ccd17f8f4e3a8958306ea08c2332~mv2.png" alt="Practice" className="w-5 h-5 absolute top-3.5 left-3.5" />
        </div>
        <span className="text-figma-14 font-medium font-paragraph text-figma-accent">Practice</span>
      </div>
    </div>
  );
}

function SidebarCourse() {
  return (
    <div className="flex flex-col items-center gap-[clamp(16px,0.6vw,35px)] pt-[clamp(30px,2.1vw,118px)] pb-[clamp(121px,8.4vw,483px)] w-24 bg-figma-primary min-h-[838px] shrink-0 z-10 border-r border-[rgba(0,0,0,0.15)]">
      <div className="flex flex-col items-center gap-1 w-14">
        <div className="flex items-center justify-center w-full h-8 rounded-[20px]">
          <img src="https://static.wixstatic.com/media/12d367_4f26ccd17f8f4e3a8958306ea08c2332~mv2.png" alt="Dashboard" className="w-[18px] h-[18px]" />
        </div>
        <span className="text-figma-14 font-medium font-paragraph text-figma-accent">Dashboard</span>
      </div>
      <div className="flex flex-col items-center gap-1 w-14">
        <div className="flex items-center justify-center w-full h-8 bg-figma-highlight rounded-[20px] relative">
          <img src="https://static.wixstatic.com/media/12d367_4f26ccd17f8f4e3a8958306ea08c2332~mv2.png" alt="Learn" className="w-[22px] h-[17px]" />
          <img src="https://static.wixstatic.com/media/12d367_4f26ccd17f8f4e3a8958306ea08c2332~mv2.png" alt="Dot" className="w-[7px] h-[7px] absolute top-[9px] left-[33px]" />
        </div>
        <span className="text-figma-14 font-medium font-paragraph text-figma-subtle">Learn</span>
      </div>
      <div className="flex flex-col items-center gap-1 w-14">
        <div className="flex items-center justify-center w-full h-8 rounded-[20px]">
          <div className="w-5 min-h-[19px] relative">
            <img src="https://static.wixstatic.com/media/12d367_4f26ccd17f8f4e3a8958306ea08c2332~mv2.png" alt="Ask" className="w-3 h-3 absolute top-0 left-2.5" />
            <img src="https://static.wixstatic.com/media/12d367_4f26ccd17f8f4e3a8958306ea08c2332~mv2.png" alt="Ask" className="w-[13px] h-3.5 absolute top-[7px] left-0" />
            <img src="https://static.wixstatic.com/media/12d367_4f26ccd17f8f4e3a8958306ea08c2332~mv2.png" alt="Ask" className="w-[5px] h-0.5 absolute top-[5px] left-[13px]" />
          </div>
        </div>
        <span className="text-figma-14 font-medium font-paragraph text-figma-accent">Ask</span>
      </div>
      <div className="flex flex-col items-center gap-1 w-14">
        <div className="flex items-center justify-center w-full h-8 rounded-[20px] relative">
          <img src="https://static.wixstatic.com/media/12d367_4f26ccd17f8f4e3a8958306ea08c2332~mv2.png" alt="Practice" className="w-[22px] h-[22px] absolute top-1 left-4" />
          <img src="https://static.wixstatic.com/media/12d367_4f26ccd17f8f4e3a8958306ea08c2332~mv2.png" alt="Practice" className="w-5 h-5 absolute top-1.5 left-4.5" />
        </div>
        <span className="text-figma-14 font-medium font-paragraph text-figma-accent">Practice</span>
      </div>
    </div>
  );
}

function Subnav() {
  return (
    <div className="flex flex-row items-center gap-2 px-6 h-14 bg-figma-color-10-2 w-full shrink-0">
      <div className="flex flex-row items-center gap-2">
        <span className="text-figma-16 font-medium font-paragraph text-figma-secondary">Learn</span>
        <img src="https://static.wixstatic.com/media/12d367_4f26ccd17f8f4e3a8958306ea08c2332~mv2.png" alt="Arrow" className="w-[11px] h-[11px]" />
      </div>
      <div className="flex flex-row items-center gap-2">
        <span className="text-figma-16 font-medium font-paragraph text-figma-secondary">Physics</span>
        <img src="https://static.wixstatic.com/media/12d367_4f26ccd17f8f4e3a8958306ea08c2332~mv2.png" alt="Arrow" className="w-[11px] h-[11px]" />
      </div>
      <div className="flex flex-row items-center gap-2">
        <span className="text-figma-16 font-medium font-paragraph text-figma-secondary">Part-I</span>
        <img src="https://static.wixstatic.com/media/12d367_4f26ccd17f8f4e3a8958306ea08c2332~mv2.png" alt="Arrow" className="w-[11px] h-[11px]" />
      </div>
      <div className="flex flex-row items-center gap-2">
        <span className="text-figma-16 font-medium font-paragraph text-figma-accent">Chapter 6</span>
      </div>
    </div>
  );
}

function CourseContent({ mode }) {
  return (
    <div className="flex flex-row w-full h-full relative">
      {/* Left Panel */}
      <div className="absolute top-6 left-6 flex flex-col gap-3 p-3 w-full max-w-[268px] bg-figma-primary rounded-[6px] shadow-[inset_0_0_0_1px_#cfcfcf] z-10">
        <div className="flex flex-row items-center gap-1.5 py-[6px] px-[9px] bg-figma-primary rounded-[20px] shadow-[inset_0_0_0_1px_#bbbbbb] w-fit">
          <span className="text-figma-6 font-[590] font-figma-sf-pro text-figma-text-1-2">Learn</span>
          <img src="https://static.wixstatic.com/media/12d367_4f26ccd17f8f4e3a8958306ea08c2332~mv2.png" alt="Arrow" className="w-0.5 h-1" />
          <span className="text-figma-6 font-[590] font-figma-sf-pro text-figma-text-1-2">Physics</span>
          <img src="https://static.wixstatic.com/media/12d367_4f26ccd17f8f4e3a8958306ea08c2332~mv2.png" alt="Arrow" className="w-0.5 h-1" />
          <span className="text-figma-6 font-[590] font-figma-sf-pro text-figma-text-1-2">Part 1</span>
          <img src="https://static.wixstatic.com/media/12d367_4f26ccd17f8f4e3a8958306ea08c2332~mv2.png" alt="Arrow" className="w-0.5 h-1" />
          <span className="text-figma-6 font-[590] font-figma-sf-pro text-figma-text-1-2">Chapter 1</span>
        </div>
        <span className="text-figma-19 font-medium font-paragraph text-figma-secondary">
          {mode === '3d' ? 'Organisms' : 'Matter in our surroundings'}
        </span>
        <div className="flex flex-col gap-2.5 w-full">
          <span className="text-figma-12 font-medium font-paragraph text-figma-secondary">
            {mode === '3d' ? '▾ Concepts' : '▸ Concepts'}
          </span>
          {mode === '3d' && (
            <div className="flex flex-col gap-2.5 w-full">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="flex flex-row justify-between items-center w-full">
                  <span className="text-figma-12 font-normal font-paragraph text-figma-text-1">1.1 Frog Anatomy</span>
                  <span className="text-figma-12 font-normal font-paragraph text-figma-text-1">Progress: 10%</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Center Content */}
      <div className="flex flex-col items-center w-full pt-6 relative">
        {/* Tabs */}
        <div className="absolute top-[24px] left-[377px] flex flex-row items-center gap-8 z-10">
          <div className={`flex items-center justify-center min-h-[37px] px-4 rounded-[40px] ${mode === '3d' ? 'bg-figma-primary shadow-[inset_0_0_0_1px_#e1e1e1]' : ''}`}>
            <span className={`text-figma-16 font-medium font-paragraph ${mode === '3d' ? 'text-figma-secondary' : 'text-figma-accent'}`}>3D / Video</span>
          </div>
          <div className={`flex items-center justify-center min-h-[37px] px-4 rounded-[40px] ${mode === 'text' ? 'bg-figma-primary shadow-[inset_0_0_0_1px_#e1e1e1]' : ''}`}>
            <span className={`text-figma-16 font-medium font-paragraph ${mode === 'text' ? 'text-figma-secondary' : 'text-figma-accent'}`}>Text</span>
          </div>
          <div className={`flex items-center justify-center min-h-[37px] px-4 rounded-[40px] ${mode === 'photo' ? 'bg-figma-primary shadow-[inset_0_0_0_1px_#e1e1e1]' : ''}`}>
            <span className={`text-figma-16 font-medium font-paragraph ${mode === 'photo' ? 'text-figma-secondary' : 'text-figma-accent'}`}>Photo</span>
          </div>
          <div className={`flex items-center justify-center min-h-[37px] px-4 rounded-[40px] ${mode === 'audio' ? 'bg-figma-primary shadow-[inset_0_0_0_1px_#e1e1e1]' : ''}`}>
            <span className={`text-figma-16 font-medium font-paragraph ${mode === 'audio' ? 'text-figma-secondary' : 'text-figma-accent'}`}>Audio</span>
          </div>
        </div>

        {/* Media Area */}
        <div className="absolute inset-0 pointer-events-none">
          {mode === '3d' && (
            <img src="https://media.base44.com/images/public/6a411f15aad7d5c6ca250fa2/5cc80c60b_d34cf9fe9_061594539d7feb33671c4c5857b387439c01558b.png" alt="3D Frog" className="w-[936px] h-[527px] absolute top-[139px] left-[85px] rounded-[20px] object-cover pointer-events-auto" />
          )}
          {mode === 'text' && (
            <>
              <p className="text-[clamp(26px,0.84vw,48px)] font-normal font-paragraph leading-[1.25] text-figma-secondary w-full max-w-[976px] h-[287px] absolute top-[207px] left-[110px] pointer-events-auto">
                Adult frog anatomy features a streamlined, tail-less body divided into head and trunk, with moist skin, webbed feet, and prominent eyes with nictitating membranes.
              </p>
              <p className="text-[clamp(26px,0.84vw,48px)] font-normal font-paragraph leading-[1.25] text-figma-secondary opacity-50 w-full max-w-[1009px] h-[287px] absolute top-[507px] left-[110px] pointer-events-auto">
                They have a three-chambered heart, breathe via lungs and skin, and possess a specialized digestive system for a carnivorous diet.
              </p>
              <img src="https://static.wixstatic.com/media/12d367_4f26ccd17f8f4e3a8958306ea08c2332~mv2.png" alt="Scrollbar" className="w-[5px] h-[127px] absolute top-[230px] left-[1100px] pointer-events-auto" />
            </>
          )}
          {mode === 'photo' && (
            <>
              <img src="https://media.base44.com/images/public/6a411f15aad7d5c6ca250fa2/0eed074de_c46569aeb_36586a5ef758e626a55e1db2cbb06746149534ed.png" alt="Photo 1" className="w-[720px] h-[402px] absolute top-[142px] left-[219px] rounded-[30px] object-cover pointer-events-auto" />
              <img src="https://media.base44.com/images/public/6a411f15aad7d5c6ca250fa2/0eed074de_c46569aeb_36586a5ef758e626a55e1db2cbb06746149534ed.png" alt="Photo 2" className="w-[720px] h-[402px] absolute top-[557px] left-[219px] rounded-[30px] object-cover pointer-events-auto" />
              <img src="https://static.wixstatic.com/media/12d367_4f26ccd17f8f4e3a8958306ea08c2332~mv2.png" alt="Scrollbar" className="w-[5px] h-[127px] absolute top-[230px] left-[1100px] pointer-events-auto" />
            </>
          )}
          {mode === 'audio' && (
            <>
              <img src="https://media.base44.com/images/public/6a411f15aad7d5c6ca250fa2/a3d0ac991_1f35bd9bb_46e74cc7ca5eef62e99e2f9b3399591eeb3940ed.png" alt="Audio Waveform" className="w-[941px] h-[163px] absolute top-[239px] left-[121px] object-cover pointer-events-auto" />
              <div className="w-full max-w-[934px] h-0.5 absolute top-[437px] left-[124px] pointer-events-auto">
                <img src="https://static.wixstatic.com/media/12d367_4f26ccd17f8f4e3a8958306ea08c2332~mv2.png" alt="Line" className="w-full h-full absolute top-0 left-0" />
                <img src="https://static.wixstatic.com/media/12d367_4f26ccd17f8f4e3a8958306ea08c2332~mv2.png" alt="Progress" className="w-[148px] h-full absolute top-0 left-0" />
              </div>
              <div className="absolute top-[476px] left-[497px] flex flex-row items-center gap-8 pointer-events-auto">
                <img src="https://static.wixstatic.com/media/12d367_4f26ccd17f8f4e3a8958306ea08c2332~mv2.png" alt="Prev" className="w-7 h-7" />
                <img src="https://static.wixstatic.com/media/12d367_4f26ccd17f8f4e3a8958306ea08c2332~mv2.png" alt="Play" className="w-9 h-9" />
                <img src="https://static.wixstatic.com/media/12d367_4f26ccd17f8f4e3a8958306ea08c2332~mv2.png" alt="Next" className="w-6 h-6" />
              </div>
              <p className="text-figma-18 font-normal font-paragraph leading-figma-29 text-center text-figma-secondary w-full max-w-[960px] h-[58px] absolute top-[572px] left-[94px] pointer-events-auto" style={{ WebkitTextStroke: "1px #ffffff" }}>
                Adult frog anatomy features a streamlined, tail-less body divided into head and trunk, with moist skin, webbed feet, and prominent eyes with nictitating membranes.
              </p>
            </>
          )}
        </div>

        {/* Bottom Controls */}
        <div className="absolute top-[736px] left-[32px] flex flex-row justify-between items-center w-full max-w-[1120px] z-20">
          <div className="flex flex-row gap-4">
            <div className="flex items-center justify-center h-12 px-12 bg-figma-primary rounded-[24px] shadow-[0px_8px_24px_0px_rgba(149,157,165,0.20)]">
              <span className="text-figma-16 font-medium font-figma-google-sans-flex text-figma-subtle">Re-Explain</span>
            </div>
            {mode === '3d' && (
              <div className="flex items-center justify-center h-12 px-12 bg-figma-primary rounded-[24px] shadow-[0px_8px_24px_0px_rgba(149,157,165,0.20)]">
                <span className="text-figma-16 font-medium font-figma-google-sans-flex text-figma-subtle">Practice</span>
              </div>
            )}
          </div>
          <div className="flex flex-row items-center gap-2 py-2 pl-4 pr-2 h-12 bg-figma-primary shadow-[0px_8px_24px_0px_rgba(149,157,165,0.20)] rounded-[46px] w-full max-w-[434px]">
            <img src="https://static.wixstatic.com/media/12d367_4f26ccd17f8f4e3a8958306ea08c2332~mv2.png" alt="Icon" className="w-3 h-5 ml-1.5" />
            <span className="text-figma-16 font-normal font-paragraph text-figma-subtle flex-1">I have a doubt</span>
            <div className="w-6 h-6 flex items-center justify-center">
              <img src="https://static.wixstatic.com/media/12d367_4f26ccd17f8f4e3a8958306ea08c2332~mv2.png" alt="Mic" className="w-[11px] h-4" />
            </div>
          </div>
          {mode !== '3d' && (
            <div className="flex items-center justify-center h-12 px-12 bg-figma-primary rounded-[24px] shadow-[0px_8px_24px_0px_rgba(149,157,165,0.20)]">
              <span className="text-figma-16 font-medium font-figma-google-sans-flex text-figma-subtle">Test my understanding</span>
            </div>
          )}
        </div>

        {/* Bottom Gradient */}
        <div className="absolute top-[457px] left-[0px] w-full max-w-[1184px] min-h-[235px] bg-[linear-gradient(180deg,_rgba(247,247,247,0.00)_0%,_rgba(247,247,247,1.00)_100%)] pointer-events-none z-10" />
      </div>
    </div>
  );
}

function AppScreen({ dropdownOpen, menuHidden, fullScreen, practiceModal, courseMode }) {
  const isCourse = courseMode !== undefined && courseMode !== null;
  const isVideo = courseMode === 'video';

  let bgClass = "bg-figma-surface";
  if (courseMode === 'text') bgClass = "bg-[#f7f7f7]";
  if (courseMode === 'photo' || courseMode === 'audio') bgClass = "bg-figma-primary";

  if (fullScreen) {
    return (
      <div className="bg-figma-surface w-full max-w-[1280px] min-h-[960px] overflow-clip relative shrink-0">
        <div className="flex flex-col gap-[18px] py-6 px-16 w-full h-full bg-figma-primary rounded-[20px] shadow-[inset_0_0_0_1px_#e6e6e6] overflow-clip relative">
          <div className="flex flex-row justify-between items-center w-full">
            <span className="text-figma-18 font-normal font-paragraph text-figma-accent">6.1 Introduction</span>
            <div className="flex flex-row items-center justify-center gap-2.5 py-2 pl-6 pr-4 bg-figma-primary rounded-[35px] shadow-[inset_0_0_0_1px_#e6e6e6] w-[120px]">
              <span className="text-figma-16 font-normal font-figma-google-sans-flex text-figma-accent">Text</span>
              <img src="https://static.wixstatic.com/media/12d367_4f26ccd17f8f4e3a8958306ea08c2332~mv2.png" alt="Arrow" className="w-2.5 h-[5px]" />
            </div>
          </div>
          <img src="https://static.wixstatic.com/media/12d367_4f26ccd17f8f4e3a8958306ea08c2332~mv2.png" alt="Line" className="w-full h-px" />
          <p className="text-figma-18 font-normal font-paragraph leading-figma-23 text-figma-secondary whitespace-pre-line">
            An extended body is essentially a system of particles, and its overall motion can be understood using the concept of the centre of mass.
            Many practical problems are simplified by treating real bodies as rigid bodies, in which the distances between all particles remain constant (even though real bodies actually deform slightly under forces).

            Types of motion of a rigid body

            Pure translational motion
            All particles move with the same velocity at any instant.
            Example: a rectangular block sliding down an inclined plane without rotating.

            Rotational motion about a fixed axis
            The rigid body rotates such that every particle moves in a circle lying in a plane perpendicular to the axis, with the centre on the axis.
            Examples: ceiling fan, potter’s wheel, merry‑go‑round.
          </p>
          <div className="bg-[linear-gradient(180deg,_rgba(255,255,255,0.00)_0%,_rgba(255,255,255,1.00)_100%)] w-full min-h-[51px] absolute bottom-0 left-0" />
          <div className="bg-figma-subtle-2 w-0.5 min-h-[247px] absolute top-[86px] right-[20px]" />
          <div className="w-7 h-7 overflow-clip absolute top-[29px] right-[224px]">
            <img src="https://static.wixstatic.com/media/12d367_4f26ccd17f8f4e3a8958306ea08c2332~mv2.png" alt="Bookmark" className="w-4 h-[21px] absolute top-1 left-1.5" />
          </div>
        </div>
        <img src="https://media.base44.com/images/public/6a411f15aad7d5c6ca250fa2/d49428730_adba226a3_be4dddd1934fdcbe07f6e483c5dd0027d54d871d.png" alt="Exit Full Screen" className="w-[266px] h-[45px] absolute top-5 left-[507px] object-cover" />
        <div className="absolute bottom-12 left-16">
          <div className="flex flex-row items-center gap-2 py-[21px] pl-[16px] pr-0 h-12 bg-figma-primary shadow-[0px_8px_24px_0px_rgba(149,157,165,0.20)] rounded-[46px] w-fit">
            <img src="https://static.wixstatic.com/media/12d367_4f26ccd17f8f4e3a8958306ea08c2332~mv2.png" alt="Icon" className="w-3 h-5 ml-1.5" />
            <span className="text-figma-16 font-normal font-paragraph text-figma-subtle mr-4">I have a doubt</span>
            <div className="flex items-center justify-center w-[52px] min-h-[52px] bg-figma-subtle rounded-[26px] shadow-[inset_0_0_0_0px_#e5e5ea] -my-[21px]">
              <img src="https://static.wixstatic.com/media/12d367_4f26ccd17f8f4e3a8958306ea08c2332~mv2.png" alt="Send" className="w-[18px] h-[18px]" />
            </div>
          </div>
        </div>
        <div className="w-8 h-8 overflow-clip absolute bottom-[208px] right-[20px] z-[14]">
          <img src="https://static.wixstatic.com/media/12d367_4f26ccd17f8f4e3a8958306ea08c2332~mv2.png" alt="Floating Icon" className="w-6 h-6 absolute top-1 left-1" />
        </div>
      </div>
    );
  }

  return (
    <div className={`${bgClass} w-[1280px] min-h-[960px] overflow-clip relative shrink-0 flex flex-col`}>
      {isCourse && !isVideo ? <TopNavCourse /> : <TopNav />}

      <div className="flex flex-row flex-1 overflow-clip relative">
        {isCourse && !isVideo ? <SidebarCourse /> : <Sidebar />}

        <div className="flex flex-col flex-1 relative">
          {!isCourse && <Subnav />}

          <div className={`flex flex-col w-full h-full overflow-y-auto ${isCourse && !isVideo ? '' : 'px-[48px] pt-[24px] pb-[48px] gap-[32px]'}`}>

            {isCourse && !isVideo ? (
              <CourseContent mode={courseMode} />
            ) : (
              <>
                <div className="flex flex-row justify-between items-center w-full">
                  <p className="text-[clamp(14px,0.42vw,24px)] font-medium font-figma-google-sans-flex leading-[1.25] text-figma-secondary">6. System of Particles and Rotational Motion</p>
                  <div className="flex flex-row items-center gap-2.5 py-[21px] px-[24px] h-12 bg-figma-primary rounded-[28px] shadow-[inset_0_0_0_1px_#e4e4e4]">
                    <div className="w-8 h-8 relative overflow-clip">
                      <img src="https://static.wixstatic.com/media/12d367_4f26ccd17f8f4e3a8958306ea08c2332~mv2.png" alt="Academic" className="w-[21px] h-[27px] absolute top-[3px] left-[5px]" />
                    </div>
                    <span className="text-figma-16 font-medium font-figma-google-sans-flex text-figma-color-17-2">Academic Chapter</span>
                  </div>
                </div>

                <div className="flex flex-row gap-[clamp(16px,0.6vw,32px)] items-start relative">
                  <div className={`flex flex-col gap-[18px] p-6 bg-figma-primary rounded-[20px] shadow-[inset_0_0_0_1px_#e6e6e6] min-h-[600px] relative overflow-clip ${menuHidden || isVideo ? 'w-[993px]' : 'w-[781px]'}`}>
                    <div className="flex flex-row justify-between items-center w-full">
                      <span className="text-figma-18 font-normal font-paragraph text-figma-accent">6.1 Introduction</span>
                      <div className={`flex flex-row items-center justify-center gap-2.5 py-2 pl-6 pr-4 rounded-[35px] shadow-[inset_0_0_0_1px_#e6e6e6] w-[120px] ${dropdownOpen ? 'bg-figma-highlight shadow-[inset_0_0_0_1px_#185cc9]' : 'bg-figma-primary'}`}>
                        <span className={`text-figma-16 font-normal font-figma-google-sans-flex ${dropdownOpen ? 'text-figma-subtle' : 'text-figma-accent'}`}>{isVideo ? 'Video' : 'Text'}</span>
                        <img src="https://static.wixstatic.com/media/12d367_4f26ccd17f8f4e3a8958306ea08c2332~mv2.png" alt="Arrow" className="w-2.5 h-[5px]" />
                      </div>
                    </div>

                    {isVideo ? (
                      <>
                        <img src="https://media.base44.com/images/public/6a411f15aad7d5c6ca250fa2/d66465b33_a2ce48af2_0f4be0f354ee03beecfad5c3bc194af7efe761eb.png" alt="Video" className="w-full h-auto rounded-[40px] object-cover" />
                        <div className="w-7 h-7 overflow-clip absolute top-[104px] right-[42px]">
                          <img src="https://static.wixstatic.com/media/12d367_4f26ccd17f8f4e3a8958306ea08c2332~mv2.png" alt="Bookmark" className="w-4 h-[21px] absolute top-1 left-1.5" />
                        </div>
                        <div className="absolute bottom-[41px] left-10 w-full max-w-[913px] min-h-[60px]">
                          <div className="bg-figma-color-20-2 rounded-[4px] w-full h-1 absolute top-[3px] left-0" />
                          <div className="bg-figma-primary rounded-[4px] w-[95px] h-1 absolute top-[3px] left-0" />
                          <div className="bg-figma-primary w-2.5 h-2.5 absolute top-0 left-[90px] rounded-full" />
                          <div className="w-9 h-9 absolute top-6 left-1.5">
                            <img src="https://static.wixstatic.com/media/12d367_4f26ccd17f8f4e3a8958306ea08c2332~mv2.png" alt="Play" className="w-4 h-[18px] absolute top-[9px] left-2.5" />
                          </div>
                          <div className="w-8 h-8 absolute top-[26px] left-[67px]">
                            <img src="https://static.wixstatic.com/media/12d367_4f26ccd17f8f4e3a8958306ea08c2332~mv2.png" alt="Volume" className="w-6 h-[23px] absolute top-1 left-1" />
                          </div>
                          <div className="w-8 h-8 absolute top-[26px] right-[110px]">
                            <img src="https://static.wixstatic.com/media/12d367_4f26ccd17f8f4e3a8958306ea08c2332~mv2.png" alt="Settings" className="w-6 h-[21px] absolute top-[5px] left-1" />
                          </div>
                          <div className="w-8 h-8 absolute top-[26px] right-[54px]">
                            <img src="https://static.wixstatic.com/media/12d367_4f26ccd17f8f4e3a8958306ea08c2332~mv2.png" alt="CC" className="w-[26px] h-[27px] absolute top-[3px] left-[3px]" />
                          </div>
                          <div className="w-6 h-6 absolute top-[30px] right-[6px]">
                            <img src="https://static.wixstatic.com/media/12d367_4f26ccd17f8f4e3a8958306ea08c2332~mv2.png" alt="Fullscreen" className="w-5 h-5 absolute top-0.5 left-0.5" />
                          </div>
                        </div>
                      </>
                    ) : (
                      <>
                        <img src="https://static.wixstatic.com/media/12d367_4f26ccd17f8f4e3a8958306ea08c2332~mv2.png" alt="Line" className="w-full h-px" />
                        <p className="text-figma-18 font-normal font-paragraph leading-figma-23 text-figma-secondary whitespace-pre-line">
                          An extended body is essentially a system of particles, and its overall motion can be understood using the concept of the centre of mass.
                          Many practical problems are simplified by treating real bodies as rigid bodies, in which the distances between all particles remain constant (even though real bodies actually deform slightly under forces).

                          Types of motion of a rigid body

                          Pure translational motion
                          All particles move with the same velocity at any instant.
                          Example: a rectangular block sliding down an inclined plane without rotating.

                          Rotational motion about a fixed axis
                          The rigid body rotates such that every particle moves in a circle lying in a plane perpendicular to the axis, with the centre on the axis.
                          Examples: ceiling fan, potter’s wheel, merry‑go‑round.
                        </p>

                        <div className="bg-figma-subtle-2 w-0.5 min-h-[247px] absolute top-[86px] right-[20px]" />
                        <div className="w-7 h-7 overflow-clip absolute top-8 right-[161px]">
                          <img src="https://static.wixstatic.com/media/12d367_4f26ccd17f8f4e3a8958306ea08c2332~mv2.png" alt="Bookmark" className="w-4 h-[21px] absolute top-1 left-1.5" />
                        </div>

                        <div className="absolute bottom-0 left-0 w-full min-h-[110px]">
                          <div className="bg-[linear-gradient(180deg,_rgba(255,255,255,0.00)_0%,_rgba(255,255,255,1.00)_100%)] w-full h-full absolute top-0 left-0" />
                          <div className="flex flex-row justify-between items-center w-[calc(100%-88px)] absolute top-[42px] left-6">
                            <div className="flex items-center justify-center h-12 bg-figma-primary rounded-[24px] shadow-[inset_0_0_0_1px_#185cc9] w-full max-w-[220px]">
                              <span className="text-figma-16 font-medium font-figma-google-sans-flex text-figma-subtle">Simplify</span>
                            </div>
                            <div className="flex items-center justify-center h-12 bg-figma-subtle rounded-[24px] shadow-[0px_8px_24px_0px_rgba(149,157,165,0.20),inset_0_0_0_1px_#ffffff] w-full max-w-[220px]">
                              <span className="text-figma-16 font-medium font-figma-google-sans-flex text-figma-primary">{practiceModal ? 'Test My Understanding' : 'Next'}</span>
                            </div>
                          </div>
                          <div className="w-6 h-6 overflow-clip absolute top-14 right-[20px]">
                            <img src="https://static.wixstatic.com/media/12d367_4f26ccd17f8f4e3a8958306ea08c2332~mv2.png" alt="Expand" className="w-5 h-5 absolute top-0.5 left-0.5" />
                          </div>
                        </div>
                      </>
                    )}
                  </div>

                  {dropdownOpen && (
                    <div className="absolute top-[70px] right-[315px] flex flex-col gap-[18px] py-[11px] px-[clamp(16px,1.1vw,64px)] w-[150px] bg-figma-primary rounded-[20px] shadow-[inset_0_0_0_1px_#e6e6e6] min-h-[180px] z-30">
                      <span className="text-figma-16 font-normal font-figma-google-sans-flex text-center text-figma-secondary">Text</span>
                      <span className="text-figma-16 font-normal font-figma-google-sans-flex text-center text-figma-secondary">Audio</span>
                      <span className="text-figma-16 font-normal font-figma-google-sans-flex text-center text-figma-accent">Image</span>
                      <span className="text-figma-16 font-normal font-figma-google-sans-flex text-center text-figma-accent">Video</span>
                    </div>
                  )}

                  <div className={`flex flex-col gap-[18px] p-4 bg-figma-primary rounded-[20px] shadow-[inset_0_0_0_1px_#e6e6e6] min-h-[680px] relative overflow-clip shrink-0 ${menuHidden || isVideo ? 'w-[60px]' : 'w-[275px]'}`}>
                    <div className="w-6 h-6 relative">
                      <img src="https://static.wixstatic.com/media/12d367_4f26ccd17f8f4e3a8958306ea08c2332~mv2.png" alt="Menu" className="w-5 h-5 absolute top-[3px] left-[3px]" />
                      <img src="https://static.wixstatic.com/media/12d367_4f26ccd17f8f4e3a8958306ea08c2332~mv2.png" alt="Menu" className="w-0.5 h-5 absolute top-[3px] left-[15px]" />
                    </div>

                    {menuHidden || isVideo ? (
                      <>
                        <span className="text-figma-16 font-medium font-figma-google-sans-flex text-figma-secondary">6.1</span>
                        <span className="text-figma-16 font-medium font-figma-google-sans-flex text-figma-accent">6.2</span>
                        <span className="text-figma-16 font-medium font-figma-google-sans-flex text-figma-accent">6.3</span>
                        <span className="text-figma-16 font-medium font-figma-google-sans-flex text-figma-accent">6.4</span>
                        <span className="text-figma-16 font-medium font-figma-google-sans-flex text-figma-accent">6.5</span>
                        <span className="text-figma-16 font-medium font-figma-google-sans-flex text-figma-accent">6.6</span>
                        <span className="text-figma-16 font-medium font-figma-google-sans-flex text-figma-accent">6.7</span>
                        <span className="text-figma-16 font-medium font-figma-google-sans-flex text-figma-accent">6.8</span>
                        <span className="text-figma-16 font-medium font-figma-google-sans-flex text-figma-accent">6.9</span>
                        <span className="text-figma-16 font-medium font-figma-google-sans-flex text-figma-accent">6.10</span>
                        <span className="text-figma-16 font-medium font-figma-google-sans-flex text-figma-accent">6.11</span>
                        <span className="text-figma-16 font-medium font-figma-google-sans-flex text-figma-accent">6.12</span>
                      </>
                    ) : (
                      <>
                        <div className="flex flex-row justify-between items-center w-full">
                          <span className="text-figma-16 font-medium font-figma-google-sans-flex text-figma-secondary">6.1 Introduction</span>
                          <img src="https://static.wixstatic.com/media/12d367_4f26ccd17f8f4e3a8958306ea08c2332~mv2.png" alt="Arrow" className="w-3.5 h-0.5" />
                        </div>
                        <div className="flex flex-col gap-3 w-full">
                          <span className="text-figma-14 font-medium font-figma-google-sans-flex text-figma-accent">6.1.1 What kind of motion can a rigid body have?</span>
                          <span className="text-figma-14 font-medium font-figma-google-sans-flex text-figma-accent">6.1.2 A large class of problems with extended bodies</span>
                        </div>
                        <div className="flex flex-row justify-between items-center w-full">
                          <span className="text-figma-16 font-medium font-figma-google-sans-flex text-figma-accent">6.2 Center of Mass</span>
                          <img src="https://static.wixstatic.com/media/12d367_4f26ccd17f8f4e3a8958306ea08c2332~mv2.png" alt="Arrow" className="w-3.5 h-3.5" />
                        </div>
                        <span className="text-figma-16 font-medium font-figma-google-sans-flex text-figma-accent">6.3 Motion of Center of Mass</span>
                        <span className="text-figma-16 font-medium font-figma-google-sans-flex text-figma-accent">6.4 Linear momentum of a system of particles</span>
                        <span className="text-figma-16 font-medium font-figma-google-sans-flex text-figma-accent">6.5 Vector product of two vectors</span>
                        <span className="text-figma-16 font-medium font-figma-google-sans-flex text-figma-accent">6.6 Angular velocity and its relation with linear velocity</span>
                        <div className="flex flex-row justify-between items-center w-full">
                          <span className="text-figma-16 font-medium font-figma-google-sans-flex text-figma-accent">6.7 Torque and angular momentum</span>
                          <img src="https://static.wixstatic.com/media/12d367_4f26ccd17f8f4e3a8958306ea08c2332~mv2.png" alt="Arrow" className="w-3.5 h-3.5" />
                        </div>
                        <span className="text-figma-16 font-medium font-figma-google-sans-flex text-figma-accent">6.8 Equilibrium of a rigid body</span>
                        <span className="text-figma-16 font-medium font-figma-google-sans-flex text-figma-accent">6.9 Moment of inertia</span>
                        <span className="text-figma-16 font-medium font-figma-google-sans-flex text-figma-accent">6.10 Kinematics of rotational motion about a fixed axis</span>
                        <span className="text-figma-16 font-medium font-figma-google-sans-flex text-figma-accent">6.11 Dynamics of rotational motion about a fixed axis</span>
                        <span className="text-figma-16 font-medium font-figma-google-sans-flex text-figma-accent">6.12 Angular momentum in case of rotations about a fixed axis</span>
                        <div className="bg-figma-subtle-2 w-0.5 min-h-[247px] absolute top-[70px] right-[6px]" />
                      </>
                    )}
                    <div className="bg-[linear-gradient(180deg,_rgba(255,255,255,0.00)_0%,_rgba(255,255,255,1.00)_100%)] w-full min-h-[51px] absolute bottom-0 left-0" />
                  </div>
                </div>

                <div className="flex flex-row items-center gap-2 py-[21px] pl-[16px] pr-0 h-12 bg-figma-primary shadow-[0px_8px_24px_0px_rgba(149,157,165,0.20)] rounded-[46px] w-fit mt-auto">
                  <img src="https://static.wixstatic.com/media/12d367_4f26ccd17f8f4e3a8958306ea08c2332~mv2.png" alt="Icon" className="w-3 h-5 ml-1.5" />
                  <span className={`text-figma-16 font-normal font-paragraph ${menuHidden || isVideo ? 'text-figma-accent' : 'text-figma-subtle'} mr-4`}>I have a doubt</span>
                  <div className="flex items-center justify-center w-[52px] min-h-[52px] bg-figma-subtle rounded-[26px] shadow-[inset_0_0_0_0px_#e5e5ea] -my-[21px]">
                    <div className="w-[18px] min-h-[21px] relative">
                      <img src="https://static.wixstatic.com/media/12d367_4f26ccd17f8f4e3a8958306ea08c2332~mv2.png" alt="Send" className="w-[18px] h-[18px] absolute top-0 left-0" />
                      <img src="https://static.wixstatic.com/media/12d367_4f26ccd17f8f4e3a8958306ea08c2332~mv2.png" alt="Send" className="w-px h-px absolute top-5 left-[9px]" />
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>

          {practiceModal && (
            <>
              <div className="absolute inset-0 bg-figma-secondary opacity-40 z-40" />
              <div className="absolute top-[96px] left-[184px] flex flex-col gap-6 p-8 w-full max-w-[720px] bg-figma-primary rounded-[32px] shadow-[inset_0_0_0_1px_#e6e6e6] z-50">
                <div className="flex flex-row justify-between items-center w-full">
                  <span className="text-[clamp(14px,0.42vw,24px)] font-medium font-figma-google-sans-flex text-figma-secondary">Practice 6.1</span>
                  <div className="w-6 h-6 overflow-clip">
                    <img src="https://static.wixstatic.com/media/12d367_4f26ccd17f8f4e3a8958306ea08c2332~mv2.png" alt="Close" className="w-5 h-5 m-0.5" />
                  </div>
                </div>
                <div className="flex flex-row items-center gap-6 w-full">
                  <span className="text-figma-18 font-normal font-paragraph text-figma-secondary flex-1">Question Example?</span>
                  <div className="w-7 h-7 overflow-clip">
                    <img src="https://static.wixstatic.com/media/12d367_4f26ccd17f8f4e3a8958306ea08c2332~mv2.png" alt="Bookmark" className="w-4 h-[21px] m-1" />
                  </div>
                </div>
                <div className="flex flex-col gap-4 w-full">
                  {['A. Example 1', 'B. Example 2', 'C. Example 3', 'D. Example 4'].map((opt, i) => (
                    <div key={i} className="flex flex-row items-center gap-2.5 p-3 rounded-[10px] shadow-[inset_0_0_0_1px_#e6e6e6] w-full">
                      <div className="w-8 h-8 bg-figma-primary rounded-[6px] shadow-[inset_0_0_0_1px_#8e8e93]" />
                      <span className="text-figma-14 font-bold font-paragraph text-figma-secondary">{opt}</span>
                    </div>
                  ))}
                </div>
                <div className="flex flex-row justify-end items-center gap-4 w-full mt-2">
                  <div className="flex items-center justify-center h-12 px-8 bg-figma-primary rounded-[24px] shadow-[inset_0_0_0_1px_#185cc9]">
                    <span className="text-figma-16 font-medium font-figma-google-sans-flex text-figma-subtle">Revisit Concept</span>
                  </div>
                  <div className="flex items-center justify-center h-12 px-8 bg-figma-subtle rounded-[24px] shadow-[0px_8px_24px_0px_rgba(149,157,165,0.20),inset_0_0_0_1px_#ffffff]">
                    <span className="text-figma-16 font-medium font-figma-google-sans-flex text-figma-primary">Next Question</span>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function Section({ title, subtitle, titleWidth, titleColor = "text-figma-secondary", children }) {
  return (
    <div className="flex flex-col gap-[clamp(20px,1.7vw,100px)]">
      <div
        className="flex flex-row justify-start items-center gap-[clamp(30px,2.6vw,150px)] py-[clamp(16px,0.8vw,47px)] px-[clamp(16px,0.9vw,49px)] bg-figma-primary rounded-[16px] min-h-[151px] overflow-clip"
        style={{ width: titleWidth }}
      >
        <p className={`text-[clamp(23px,0.73vw,42px)] font-bold font-figma-open-sans leading-[1.3571] ${titleColor} shrink-0 grow-0`}>
          {title}
        </p>
        {subtitle && (
          <p className="text-[clamp(23px,0.73vw,42px)] font-bold font-figma-open-sans leading-[1.3571] text-figma-subtle shrink-0 grow-0">
            {subtitle}
          </p>
        )}
      </div>
      {children}
    </div>
  );
}

export default function LearningPage() {
  return (
    <div className="bg-figma-color-16-2 min-h-screen w-full flex flex-col font-figma-inter overflow-x-auto relative">
      <header className="w-full flex flex-col shrink-0">
        <div className="w-full min-h-[88px] relative bg-[#178f51]">
          <div className="bg-[#dea000] w-full h-full absolute top-0 left-0 z-[0]" />
          <div className="bg-[#178f51] w-full h-full absolute top-0 left-0 z-[1]" />
          <p className="text-[clamp(18px,0.56vw,32px)] font-bold font-figma-roboto leading-[1.1875] text-figma-primary absolute top-[25px] left-[107px] z-[3]">Title</p>
        </div>
        <div className="w-full min-h-[320px] bg-figma-color-17-2 relative">
          <p className="text-[clamp(53px,1.68vw,96px)] font-bold font-figma-inter leading-[1.5] tracking-[-0.0229em] text-figma-primary absolute top-[114px] left-[120px] z-[2]">Learning Page</p>
        </div>
      </header>

      <div className="flex flex-col px-[clamp(22px,2.6vw,150px)] pt-[clamp(38px,2.6vw,150px)] pb-[clamp(75px,5.2vw,300px)] gap-[clamp(50px,4.4vw,250px)] w-max relative">
        <div className="flex flex-row gap-[clamp(20px,1.7vw,100px)]">
          <Section title="Learning Page" titleWidth="395px">
            <AppScreen />
          </Section>
          <Section title="Content Type Dropdown" titleWidth="608px">
            <AppScreen dropdownOpen />
          </Section>
          <Section title="Menu hidden" titleWidth="375px">
            <AppScreen menuHidden />
          </Section>
          <Section title="Full Screen clicked" titleWidth="726px" subtitle="Text">
            <AppScreen fullScreen />
          </Section>
        </div>

        <div className="flex flex-row gap-[clamp(20px,1.7vw,100px)] items-start">
          <Section title="Practice / Test My Understanding" titleWidth="794px">
            <AppScreen practiceModal />
          </Section>
          <div className="mt-[clamp(43px,3vw,172px)] relative">
            <Section title="Learning Course Page (3D/Video)" titleWidth="780px" titleColor="text-figma-subtle">
              <div className="flex flex-row gap-[clamp(20px,1.7vw,100px)]">
                <AppScreen courseMode="3d" />
                <AppScreen courseMode="text" />
                <AppScreen courseMode="photo" />
                <AppScreen courseMode="audio" />
              </div>
            </Section>
            <p className="text-figma-18 font-normal font-paragraph leading-figma-29 text-center text-figma-secondary w-full max-w-[960px] absolute top-[1131px] left-[230px] z-[17]" style={{ WebkitTextStroke: "3px #ffffff" }}>
              Adult frog anatomy features a streamlined, tail-less body divided into head and trunk, with moist skin, webbed feet, and prominent eyes with nictitating membranes.
            </p>
          </div>
        </div>

        <div className="flex flex-row gap-[clamp(20px,1.7vw,100px)]">
          <Section title="Video" titleWidth="216px">
            <AppScreen courseMode="video" />
          </Section>
        </div>
      </div>
    </div>
  );
}
