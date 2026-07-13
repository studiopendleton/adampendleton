import { CogIcon } from '@sanity/icons';
import { defineArrayMember, defineField, defineType } from 'sanity';
import { imageField } from './shared/imageField';

const registeredFonts = [
  { title: 'ABC Monument Grotesk', value: 'ABCMonumentGrotesk' },
  { title: 'Unica Medium', value: 'UnicaMedium' },
  { title: 'Unica', value: 'Unica' },
] as const;

export const siteSettings = defineType({
  name: 'siteSettings',
  title: 'Homepage',
  type: 'document',
  icon: CogIcon,
  groups: [
    { name: 'content', title: 'Content', default: true },
    { name: 'appearance', title: 'Appearance' },
  ],
  fields: [
    defineField({
      name: 'title',
      title: 'Title',
      type: 'string',
      group: 'content',
      initialValue: 'Adam Pendleton',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'mainText',
      title: 'Main Text Blocks',
      type: 'array',
      group: 'content',
      of: [
        defineArrayMember({
          name: 'homeTextBlock',
          title: 'Home Text Block',
          type: 'object',
          fields: [
            defineField({
              name: 'content',
              title: 'Content',
              type: 'array',
              of: [defineArrayMember({ type: 'block' })],
            }),
          ],
          preview: {
            select: { content: 'content' },
            prepare: ({ content }) => ({
              title:
                content?.[0]?.children
                  ?.map((child: { text?: string }) => child.text)
                  .join('')
                  .replace(/\n/g, ' ')
                  .slice(0, 80) || 'Text block',
            }),
          },
        }),
      ],
    }),
    defineField({
      name: 'frameHeight',
      title: 'Minimum Paragraph Frame Height',
      type: 'number',
      group: 'appearance',
      initialValue: 100,
      validation: (rule) => rule.min(50).max(200),
    }),
    defineField({
      name: 'footerText',
      title: 'Footer Text',
      type: 'array',
      group: 'content',
      of: [defineArrayMember({ type: 'block' })],
    }),
    imageField('desktopBackgroundImage', 'Desktop Background Image', 'appearance'),
    imageField('mobileBackgroundImage', 'Mobile Background Image', 'appearance'),
    defineField({
      name: 'backgroundPosition',
      title: 'Background Image Position',
      type: 'string',
      group: 'appearance',
      options: { list: ['top', 'center', 'bottom'], layout: 'radio' },
      initialValue: 'top',
    }),
    defineField({
      name: 'bodyTextColor',
      title: 'Body text color',
      type: 'string',
      group: 'appearance',
      description:
        'CSS --body-color: body text color, and the background behind link hover text. Hex or rgb strings (e.g. #232323).',
      initialValue: '#232323',
    }),
    defineField({
      name: 'backgroundColor',
      title: 'Link hover text color',
      type: 'string',
      group: 'appearance',
      description:
        'CSS --background-color: page background under the image, and link hover text color. Hex or rgb strings (e.g. #ffffff).',
      initialValue: '#ffffff',
    }),
    defineField({
      name: 'fontSize',
      title: 'Font Size Desktop',
      type: 'string',
      group: 'appearance',
      options: { list: ['2.5rem', '3rem', '3.5rem', '4rem'] },
      initialValue: '3rem',
    }),
    defineField({
      name: 'mobileFontSize',
      title: 'Font Size Mobile Scale',
      type: 'number',
      group: 'appearance',
      options: { list: [0.25, 0.33, 0.5, 0.66] },
      initialValue: 0.5,
    }),
    defineField({
      name: 'blend',
      title: 'Blend Text',
      type: 'boolean',
      group: 'appearance',
      initialValue: true,
    }),
    defineField({
      name: 'font',
      title: 'Font',
      type: 'string',
      group: 'appearance',
      options: {
        list: registeredFonts.map(({ title, value }) => ({ title, value })),
        layout: 'radio',
      },
      initialValue: 'ABCMonumentGrotesk',
      validation: (rule) =>
        rule.required().custom((value) => {
          if (!value || registeredFonts.some((font) => font.value === value)) return true;
          return 'Font must match a @font-face family in global.css';
        }),
    }),
  ],
});
