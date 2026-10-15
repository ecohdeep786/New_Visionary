/** Keep authored banner colors while giving normal-size labels at least 4.5:1 contrast. */
export function classColors(value){
 const background=/^#[0-9a-f]{6}$/i.test(value||'')?value:'#0b57d2';
 const channels=[1,3,5].map(i=>parseInt(background.slice(i,i+2),16)/255).map(c=>c<=.04045?c/12.92:((c+.055)/1.055)**2.4);
 const luminance=channels[0]*.2126+channels[1]*.7152+channels[2]*.0722;
 return {backgroundColor:background,color:luminance>.179?'#000000':'#ffffff'};
}
